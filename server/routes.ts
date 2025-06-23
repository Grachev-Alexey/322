import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createYclientsService } from "./services/yclients";
import { z } from "zod";
import { db } from "./db";
import { users } from "@shared/schema";

// Extend session types
declare module 'express-session' {
  interface SessionData {
    userId: number;
    userRole: string;
  }
}

interface YclientsConfig {
  token: string;
  authCookie: string;
  chainId: string;
  categoryId: string;
  branchIds: string[];
}

const authSchema = z.object({
  pin: z.string().min(4).max(6)
});

const clientSchema = z.object({
  phone: z.string().min(10),
  email: z.string().email().optional()
});

const calculationSchema = z.object({
  services: z.array(z.object({
    id: z.number(),
    quantity: z.number()
  })),
  packageType: z.enum(['vip', 'standard', 'economy']),
  downPayment: z.number(),
  installmentMonths: z.number().optional(),
  usedCertificate: z.boolean().default(false),
  freeZones: z.array(z.object({
    serviceId: z.number(),
    quantity: z.number()
  })).default([])
});

const configSchema = z.object({
  key: z.string(),
  value: z.any()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default data on startup
  await storage.initializeDefaultData();
  
  // Authentication
  app.post("/api/auth", async (req, res) => {
    try {
      const { pin } = authSchema.parse(req.body);
      const user = await storage.getUserByPin(pin);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Неверный PIN-код" });
      }

      // Store user in session
      (req.session as any).userId = user.id;
      (req.session as any).userRole = user.role;
      (req.session as any).userName = user.name;
      
      res.json({ 
        user: { 
          id: user.id, 
          name: user.name, 
          role: user.role,
          pin: user.pin,
          isActive: user.isActive
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Ошибка валидации данных" });
    }
  });

  app.post("/api/logout", (req, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
        res.json({ success: true });
      });
    } else {
      res.json({ success: true });
    }
  });

  // Auth check route
  app.get("/api/auth/check", (req, res) => {
    const session = req.session as any;
    if (session?.userId) {
      res.json({ 
        user: { 
          id: session.userId, 
          name: session.userName || 'Пользователь', 
          role: session.userRole,
          pin: '',
          isActive: true
        } 
      });
    } else {
      res.status(401).json({ message: "Не авторизован" });
    }
  });

  // Middleware for authentication
  const requireAuth = (req: any, res: any, next: any) => {
    const session = req.session as any;
    if (!session?.userId) {
      return res.status(401).json({ message: "Требуется авторизация" });
    }
    next();
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    const session = req.session as any;
    if (!session?.userId || session.userRole !== 'admin') {
      return res.status(403).json({ message: "Требуются права администратора" });
    }
    next();
  };

  // Services
  app.get("/api/services", requireAuth, async (req, res) => {
    try {
      const services = await storage.getActiveServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения услуг" });
    }
  });

  app.post("/api/services/sync", requireAdmin, async (req, res) => {
    try {
      const yclientsConfig = await storage.getConfig('yclients');
      if (!yclientsConfig) {
        return res.status(400).json({ message: "Настройки Yclients не найдены" });
      }

      const yclientsService = createYclientsService(yclientsConfig.value as YclientsConfig);
      const services = await yclientsService.getServices();
      
      for (const service of services) {
        await storage.upsertService({
          yclientsId: service.id,
          title: service.title,
          priceMin: service.price_min.toString(),
          categoryId: service.category_id || null,
          isActive: true
        });
      }

      res.json({ message: "Услуги синхронизированы", count: services.length });
    } catch (error) {
      res.status(500).json({ message: "Ошибка синхронизации услуг" });
    }
  });

  // Subscription Types sync
  app.post("/api/subscription-types/sync", requireAdmin, async (req, res) => {
    try {
      const yclientsConfig = await storage.getConfig('yclients');
      if (!yclientsConfig) {
        return res.status(400).json({ message: "Настройки Yclients не найдены" });
      }

      const yclientsService = createYclientsService(yclientsConfig.value as YclientsConfig);
      const subscriptionTypes = await yclientsService.getSubscriptionTypes();
      
      for (const subscriptionType of subscriptionTypes) {
        await storage.upsertSubscriptionType({
          yclientsId: subscriptionType.id,
          title: subscriptionType.title,
          cost: subscriptionType.cost.toString(),
          allowFreeze: subscriptionType.allow_freeze,
          freezeLimit: subscriptionType.freeze_limit,
          balanceContainer: subscriptionType.balance_container
        });
      }

      res.json({ message: "Типы абонементов синхронизированы", count: subscriptionTypes.length });
    } catch (error) {
      console.error("Error syncing subscription types:", error);
      res.status(500).json({ message: "Ошибка синхронизации типов абонементов" });
    }
  });

  // Admin routes - Subscription Types Management  
  app.get("/api/admin/subscription-types", requireAdmin, async (req, res) => {
    try {
      const subscriptionTypes = await storage.getSubscriptionTypes();
      res.json(subscriptionTypes);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения типов абонементов" });
    }
  });

  // Configuration
  app.get("/api/config/:key", requireAdmin, async (req, res) => {
    try {
      const config = await storage.getConfig(req.params.key);
      res.json(config?.value || null);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения настроек" });
    }
  });

  app.post("/api/config", requireAdmin, async (req, res) => {
    try {
      const { key, value } = configSchema.parse(req.body);
      const config = await storage.setConfig(key, value);
      res.json(config);
    } catch (error) {
      res.status(400).json({ message: "Ошибка сохранения настроек" });
    }
  });

  // Get packages configuration
  app.get("/api/packages", requireAuth, async (req, res) => {
    try {
      const packages = await storage.getPackages();
      res.json(packages);
    } catch (error) {
      console.error('Error getting packages:', error);
      res.status(500).json({ message: "Ошибка получения пакетов" });
    }
  });

  // Get all perks and package values
  app.get("/api/perks", requireAuth, async (req, res) => {
    try {
      const perkValues = await storage.getPackagePerkValues();
      res.json(perkValues);
    } catch (error) {
      console.error("Error getting perks:", error);
      res.status(500).json({ message: "Ошибка получения перков" });
    }
  });

  // Admin routes - Universal Perks Management
  app.get("/api/admin/perks", requireAdmin, async (req, res) => {
    try {
      const perks = await storage.getPerks();
      res.json(perks);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения перков" });
    }
  });

  app.get("/api/admin/perk-values", requireAdmin, async (req, res) => {
    try {
      const perkValues = await storage.getPackagePerkValues();
      res.json(perkValues);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения значений перков" });
    }
  });

  app.post("/api/admin/perks", requireAdmin, async (req, res) => {
    try {
      const perk = req.body;
      const result = await storage.createPerk(perk);
      res.json(result);
    } catch (error) {
      console.error('Error creating perk:', error);
      res.status(500).json({ message: "Ошибка создания перка" });
    }
  });

  app.put("/api/admin/perks/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const result = await storage.updatePerk(parseInt(id), updates);
      res.json(result);
    } catch (error) {
      console.error('Error updating perk:', error);
      res.status(500).json({ message: "Ошибка обновления перка" });
    }
  });

  app.post("/api/admin/perk-values", requireAdmin, async (req, res) => {
    try {
      const perkValue = req.body;
      const result = await storage.createPackagePerkValue(perkValue);
      res.json(result);
    } catch (error) {
      console.error('Error creating perk value:', error);
      res.status(500).json({ message: "Ошибка создания значения перка" });
    }
  });

  app.delete("/api/admin/perks/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePerk(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting perk:', error);
      res.status(500).json({ message: "Ошибка удаления перка" });
    }
  });

  app.put("/api/admin/perk-values/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const result = await storage.updatePackagePerkValue(parseInt(id), updates);
      res.json(result);
    } catch (error) {
      console.error('Error updating perk value:', error);
      res.status(500).json({ message: "Ошибка обновления значения перка" });
    }
  });

  // Admin routes - User Management
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения пользователей" });
    }
  });

  app.post("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const { pin, role, name } = req.body;
      if (!pin || !role || !name) {
        return res.status(400).json({ message: "Необходимо заполнить все поля" });
      }
      
      // Check if PIN already exists
      const existingUser = await storage.getUserByPin(pin);
      if (existingUser) {
        return res.status(400).json({ message: "Пользователь с таким PIN уже существует" });
      }

      const user = await storage.createUser({
        pin,
        role,
        name,
        isActive: true
      });
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Ошибка создания пользователя" });
    }
  });

  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { pin, role, name, isActive } = req.body;
      
      // Check if PIN is taken by another user
      if (pin) {
        const existingUser = await storage.getUserByPin(pin);
        if (existingUser && existingUser.id !== parseInt(id)) {
          return res.status(400).json({ message: "Пользователь с таким PIN уже существует" });
        }
      }

      const user = await storage.updateUser(parseInt(id), {
        pin,
        role,
        name,
        isActive
      });
      
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления пользователя" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const userId = parseInt(id);
      
      // Prevent deletion of current user
      if ((req as any).session.userId === userId) {
        return res.status(400).json({ message: "Нельзя удалить самого себя" });
      }
      
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Ошибка удаления пользователя" });
    }
  });

  // Admin routes - Service Management  
  app.get("/api/admin/services", requireAdmin, async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения услуг" });
    }
  });

  app.put("/api/admin/services/:yclientsId", requireAdmin, async (req, res) => {
    try {
      const { yclientsId } = req.params;
      const { isActive } = req.body;
      
      await storage.updateServiceStatus(parseInt(yclientsId), isActive);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Ошибка обновления статуса услуги" });
    }
  });

  app.get("/api/admin/sales", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getSalesStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения статистики продаж" });
    }
  });

  app.post("/api/admin/packages", requireAdmin, async (req, res) => {
    try {
      const packageData = req.body;
      
      const result = await storage.createOrUpdatePackage(packageData);
      
      res.json(result);
    } catch (error) {
      console.error('Error saving package:', error);
      res.status(500).json({ message: "Ошибка сохранения пакета", error: error.message });
    }
  });

  app.get("/api/admin/package-perks/:packageType", requireAdmin, async (req, res) => {
    try {
      const { packageType } = req.params;
      const perks = await storage.getPackagePerks(packageType);
      res.json(perks);
    } catch (error) {
      res.status(500).json({ message: "Ошибка получения преимуществ пакета" });
    }
  });

  app.post("/api/admin/package-perks", requireAdmin, async (req, res) => {
    try {
      const perkData = req.body;
      const result = await storage.upsertPackagePerk(perkData);
      res.json(result);
    } catch (error) {
      console.error('Error saving perk:', error);
      res.status(500).json({ message: "Ошибка сохранения плюшки пакета" });
    }
  });

  app.delete("/api/admin/package-perks/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deletePackagePerk(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Ошибка удаления плюшки пакета" });
    }
  });

  // Subscription creation
  app.post("/api/subscription", requireAuth, async (req, res) => {
    try {
      const { client: clientData, calculation } = req.body;
      const { phone, email } = clientSchema.parse(clientData);
      
      // Get or create client
      let client = await storage.getClientByPhone(phone);
      if (!client) {
        client = await storage.createClient({ phone, email: email || null });
      }

      // Check if subscription type exists in Yclients
      const yclientsConfig = await storage.getConfig('yclients');
      if (!yclientsConfig) {
        return res.status(400).json({ message: "Настройки Yclients не найдены" });
      }

      const yclientsService = createYclientsService(yclientsConfig.value as YclientsConfig);
      
      // Try to find existing subscription type
      let subscriptionType = await storage.findSubscriptionType(
        calculation.services, 
        calculation.finalCost, 
        calculation.packageType
      );

      if (!subscriptionType) {
        // Create new subscription type in Yclients
        const templateConfig = await storage.getConfig('subscriptionTemplate');
        const template = templateConfig?.value || "Курс {services} - {package}";
        
        const title = generateSubscriptionTitle(template, calculation);
        
        const servicesForYclients = calculation.services.map((service: any) => ({
          serviceId: service.id || service.serviceId,
          count: service.quantity || service.count || 1
        }));

        console.log('Creating subscription with data:', {
          title,
          cost: calculation.finalCost,
          services: servicesForYclients,
          packageType: calculation.packageType
        });

        const yclientsSubscriptionType = await yclientsService.createSubscriptionType({
          title,
          cost: calculation.finalCost,
          services: servicesForYclients,
          allowFreeze: getFreezePolicyForPackage(calculation.packageType),
          freezeLimit: getFreezeLimitForPackage(calculation.packageType),
          packageType: calculation.packageType
        });

        // Save to local database
        subscriptionType = await storage.upsertSubscriptionType({
          yclientsId: yclientsSubscriptionType.id,
          title: yclientsSubscriptionType.title,
          cost: yclientsSubscriptionType.cost.toString(),
          allowFreeze: yclientsSubscriptionType.allow_freeze,
          freezeLimit: yclientsSubscriptionType.freeze_limit,
          balanceContainer: yclientsSubscriptionType.balance_container
        });
      }

      // Save sale to database
      const sale = await storage.createSale({
        clientId: client.id,
        masterId: (req as any).session.userId,
        subscriptionTypeId: subscriptionType.id,
        selectedServices: calculation.services,
        selectedPackage: calculation.packageType,
        baseCost: calculation.baseCost.toString(),
        finalCost: calculation.finalCost.toString(),
        totalSavings: calculation.totalSavings.toString(),
        downPayment: calculation.downPayment.toString(),
        installmentMonths: calculation.installmentMonths || null,
        monthlyPayment: calculation.monthlyPayment?.toString() || null,
        appliedDiscounts: calculation.appliedDiscounts,
        freeZones: calculation.freeZones,
        usedCertificate: calculation.usedCertificate
      });

      res.json({ 
        success: true, 
        subscriptionType: subscriptionType.title,
        saleId: sale.id 
      });
    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ message: "Ошибка создания абонемента" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculatePackagePricing(baseCost: number, calculation: any, packages: any) {
  const { services, packageType, downPayment, installmentMonths, usedCertificate, freeZones } = calculation;
  
  // Calculate procedure count
  const totalProcedures = services.reduce((sum: number, service: any) => sum + service.quantity, 0);
  
  // Base package discounts - get from packages array
  const packageMap = {};
  packages.forEach((pkg: any) => {
    packageMap[pkg.type] = {
      discount: parseFloat(pkg.discount),
      minCost: parseFloat(pkg.minCost),
      minDownPaymentPercent: parseFloat(pkg.minDownPaymentPercent),
      requiresFullPayment: pkg.requiresFullPayment,
      name: pkg.name
    };
  });
  
  const packageDiscounts = {
    vip: packageMap['vip']?.discount || 0.30,
    standard: packageMap['standard']?.discount || 0.20,
    economy: packageMap['economy']?.discount || 0.10
  };

  // Additional discounts
  let additionalDiscount = 0;
  
  // Bulk procedure discount
  if (totalProcedures >= 15) {
    additionalDiscount += 0.025; // +2.5%
  }
  
  // Certificate discount
  let certificateDiscount = 0;
  if (usedCertificate && baseCost >= 25000) {
    certificateDiscount = 3000;
  }

  // Calculate for each package
  const results: any = {};
  
  for (const [pkg, discount] of Object.entries(packageDiscounts)) {
    let finalDiscount = discount as number + additionalDiscount;
    
    // Special logic for economy package
    if (pkg === 'economy' && downPayment > 10000) {
      finalDiscount = Math.max(finalDiscount, 0.30);
    }
    
    const discountAmount = baseCost * finalDiscount;
    const finalCost = baseCost - discountAmount - certificateDiscount;
    
    // Calculate free zones value
    const freeZonesValue = freeZones.reduce((sum: number, zone: any) => {
      return sum + (zone.pricePerProcedure * zone.quantity);
    }, 0);
    
    const totalSavings = discountAmount + certificateDiscount + freeZonesValue;
    
    // Check availability
    let isAvailable = true;
    let unavailableReason = '';
    
    const pkgConfig = packageMap[pkg];
    if (!pkgConfig) {
      isAvailable = false;
      unavailableReason = 'Пакет не найден';
    } else {
      // Check minimum cost requirement
      if (baseCost < pkgConfig.minCost) {
        isAvailable = false;
        unavailableReason = `Минимальная стоимость курса ${pkgConfig.minCost.toLocaleString()} ₽`;
      } else {
        // All packages are available for selection - payment constraints will be applied when selected
        isAvailable = true;
        unavailableReason = '';
      }
    }
    
    // Calculate monthly payment
    let monthlyPayment = 0;
    if (isAvailable && installmentMonths && installmentMonths > 0 && pkg !== 'vip') {
      monthlyPayment = (finalCost - downPayment) / installmentMonths;
    }
    
    results[pkg] = {
      isAvailable,
      unavailableReason,
      finalCost,
      totalSavings,
      monthlyPayment,
      appliedDiscounts: [
        { type: 'package', amount: discountAmount },
        ...(additionalDiscount > 0 ? [{ type: 'bulk', amount: baseCost * 0.025 }] : []),
        ...(certificateDiscount > 0 ? [{ type: 'certificate', amount: certificateDiscount }] : [])
      ]
    };
  }
  
  return {
    baseCost,
    packages: results,
    totalProcedures,
    freeZonesValue: freeZones.reduce((sum: number, zone: any) => sum + (zone.pricePerProcedure * zone.quantity), 0)
  };
}

function generateSubscriptionTitle(template: string, calculation: any): string {
  // Simple template replacement
  return template
    .replace('{services}', calculation.services.map((s: any) => s.name).join(', '))
    .replace('{package}', calculation.packageType.toUpperCase());
}

function getFreezePolicyForPackage(packageType: string): boolean {
  return packageType !== 'none'; // All packages allow freeze
}

function getFreezeLimitForPackage(packageType: string): number {
  const limits = {
    vip: 3650, // Unlimited (10 years)
    standard: 180, // 6 months
    economy: 90 // 3 months
  };
  return (limits as any)[packageType] || 0;
}