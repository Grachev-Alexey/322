import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createYclientsService } from "./services/yclients";
import { pdfGenerator } from "./services/pdf-generator";
import { EmailServiceFactory } from "./services/email-service";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { users, services, insertUserSchema, insertConfigSchema, insertServiceSchema, 
  insertSubscriptionTypeSchema, insertPerkSchema, insertPackagePerkValueSchema,
  insertPackageSchema, config, perks, packagePerkValues,
  packages as packagesTable } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

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

const offerSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().min(10),
  clientEmail: z.string().email(),
  selectedServices: z.array(z.any()),
  selectedPackage: z.enum(['vip', 'standard', 'economy']),
  baseCost: z.number(),
  finalCost: z.number(),
  totalSavings: z.number(),
  downPayment: z.number(),
  installmentMonths: z.number().optional(),
  monthlyPayment: z.number().optional(),
  paymentSchedule: z.array(z.any()),
  appliedDiscounts: z.array(z.any()).optional(),
  freeZones: z.array(z.any()).optional(),
  usedCertificate: z.boolean().default(false)
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

  app.put("/api/admin/packages/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { bonusAccountPercent } = req.body;
      
      if (bonusAccountPercent === undefined || bonusAccountPercent < 0 || bonusAccountPercent > 1) {
        return res.status(400).json({ message: "Неверное значение бонусного счета" });
      }
      
      const result = await storage.updatePackage(parseInt(id), { bonusAccountPercent: bonusAccountPercent.toString() });
      if (!result) {
        return res.status(404).json({ message: "Пакет не найден" });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error updating package:', error);
      res.status(500).json({ message: "Ошибка обновления пакета" });
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

  // Sales statistics endpoint
  app.get("/api/admin/sales", requireAdmin, async (req, res) => {
    try {
      const salesStats = await storage.getSalesStats();
      res.json(salesStats);
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      res.status(500).json({ message: "Ошибка получения статистики продаж" });
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
      
      // Add service titles to calculation for title generation
      const allServices = await storage.getAllServices();
      const servicesWithTitles = calculation.services.map((service: any) => {
        const serviceData = allServices.find(s => s.yclientsId === service.id);
        return {
          ...service,
          title: serviceData?.title || 'Неизвестная услуга'
        };
      });
      calculation.services = servicesWithTitles;

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
        
        const title = await generateSubscriptionTitle(template, calculation);
        
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

  // Create directory for PDFs if it doesn't exist
  const pdfDir = path.join(process.cwd(), 'pdfs');
  try {
    await fs.access(pdfDir);
  } catch {
    await fs.mkdir(pdfDir, { recursive: true });
  }

  // API endpoint for creating offers
  app.post("/api/offers", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Не авторизован" });
      }

      // Generate payment schedule first
      const paymentSchedule = generatePaymentSchedule(
        req.body.downPayment,
        req.body.finalCost,
        req.body.installmentMonths
      );
      
      // Add payment schedule to request body for validation
      const requestWithSchedule = {
        ...req.body,
        paymentSchedule,
        appliedDiscounts: req.body.appliedDiscounts || [],
        freeZones: req.body.freeZones || []
      };
      
      const offerData = offerSchema.parse(requestWithSchedule);
      
      // Generate unique offer number
      const offerNumber = await generateUniqueOfferNumber();

      // Create or find client
      let client = await storage.getClientByPhone(offerData.clientPhone);
      if (!client) {
        client = await storage.createClient({
          phone: offerData.clientPhone,
          email: offerData.clientEmail
        });
      }

      // Set expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create offer
      const offer = await storage.createOffer({
        clientId: client.id,
        masterId: req.session.userId,
        offerNumber,
        selectedServices: offerData.selectedServices,
        selectedPackage: offerData.selectedPackage,
        baseCost: offerData.baseCost.toString(),
        finalCost: offerData.finalCost.toString(),
        totalSavings: offerData.totalSavings.toString(),
        downPayment: offerData.downPayment.toString(),
        installmentMonths: offerData.installmentMonths,
        monthlyPayment: offerData.monthlyPayment?.toString(),
        paymentSchedule: offerData.paymentSchedule,
        appliedDiscounts: offerData.appliedDiscounts || [],
        freeZones: offerData.freeZones || [],
        usedCertificate: offerData.usedCertificate,
        clientName: offerData.clientName,
        clientPhone: offerData.clientPhone,
        clientEmail: offerData.clientEmail,
        status: 'draft',
        expiresAt
      });

      res.json(offer);
    } catch (error) {
      console.error('Ошибка создания оферты:', error);
      res.status(500).json({ message: "Ошибка создания оферты" });
    }
  });

  // API endpoint for generating PDF and sending email
  app.post("/api/offers/:id/send", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Не авторизован" });
      }

      const offerId = parseInt(req.params.id);

      // Get offer
      const offers = await storage.getOffersByMaster(req.session.userId);
      const offer = offers.find(o => o.id === offerId);
      
      if (!offer) {
        return res.status(404).json({ message: "Оферта не найдена" });
      }

      if (!offer.clientEmail) {
        return res.status(400).json({ message: "Email клиента не указан" });
      }

      // Get email configuration from database
      const emailSettings = await storage.getConfig('email_settings');
      if (!emailSettings || !emailSettings.value) {
        return res.status(400).json({ message: "Настройки email не настроены" });
      }

      const emailConfig = emailSettings.value as any;

      // Generate PDF
      const pdfBuffer = await pdfGenerator.generateOfferPDF(offer);
      
      // Save PDF to file
      const fileName = `offer_${offer.offerNumber}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      await fs.writeFile(filePath, pdfBuffer);

      // Create email service based on configuration
      let emailService;
      switch (emailConfig.provider) {
        case 'gmail':
          emailService = EmailServiceFactory.createGmailService(
            emailConfig.email,
            emailConfig.password
          );
          break;
        case 'yandex':
          emailService = EmailServiceFactory.createYandexService(
            emailConfig.email,
            emailConfig.password
          );
          break;
        case 'mailru':
          emailService = EmailServiceFactory.createMailRuService(
            emailConfig.email,
            emailConfig.password
          );
          break;
        default:
          return res.status(400).json({ message: "Неподдерживаемый провайдер email" });
      }

      // Test connection first
      const connectionTest = await emailService.testConnection();
      if (!connectionTest) {
        return res.status(500).json({ message: "Ошибка подключения к почтовому серверу" });
      }

      // Send email
      const emailSent = await emailService.sendOfferEmail(offer, pdfBuffer);
      
      if (emailSent) {
        // Update offer status
        await storage.updateOffer(offer.id, {
          pdfPath: filePath,
          emailSent: true,
          emailSentAt: new Date(),
          status: 'sent'
        });

        res.json({ 
          success: true, 
          message: "Оферта успешно отправлена",
          pdfPath: filePath 
        });
      } else {
        res.status(500).json({ message: "Ошибка отправки email" });
      }
    } catch (error) {
      console.error('Ошибка отправки оферты:', error);
      res.status(500).json({ message: "Ошибка отправки оферты" });
    }
  });

  // API endpoint for getting offers
  app.get("/api/offers", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Не авторизован" });
      }

      const offers = await storage.getOffersByMaster(req.session.userId);
      res.json(offers);
    } catch (error) {
      console.error('Ошибка получения оферт:', error);
      res.status(500).json({ message: "Ошибка получения оферт" });
    }
  });

  // API endpoint for getting specific offer
  app.get("/api/offers/:number", async (req, res) => {
    try {
      const offer = await storage.getOfferByNumber(req.params.number);
      
      if (!offer) {
        return res.status(404).json({ message: "Оферта не найдена" });
      }

      res.json(offer);
    } catch (error) {
      console.error('Ошибка получения оферты:', error);
      res.status(500).json({ message: "Ошибка получения оферты" });
    }
  });

  // API endpoint for updating offer status
  app.patch("/api/offers/:id", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Не авторизован" });
      }

      const offerId = parseInt(req.params.id);
      const { status } = req.body;

      const updatedOffer = await storage.updateOffer(offerId, { status });
      
      if (!updatedOffer) {
        return res.status(404).json({ message: "Оферта не найдена" });
      }

      res.json(updatedOffer);
    } catch (error) {
      console.error('Ошибка обновления оферты:', error);
      res.status(500).json({ message: "Ошибка обновления оферты" });
    }
  });

  // Email settings endpoints
  app.get("/api/admin/email-settings", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Нет доступа" });
      }

      const settings = await storage.getConfig('email_settings');
      res.json(settings ? settings.value : null);
    } catch (error) {
      console.error('Ошибка получения настроек email:', error);
      res.status(500).json({ message: "Ошибка получения настроек email" });
    }
  });

  app.post("/api/admin/email-settings", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Нет доступа" });
      }

      const emailSettings = req.body;
      await storage.setConfig('email_settings', emailSettings);
      
      res.json({ success: true, message: "Настройки email сохранены" });
    } catch (error) {
      console.error('Ошибка сохранения настроек email:', error);
      res.status(500).json({ message: "Ошибка сохранения настроек email" });
    }
  });

  app.post("/api/admin/test-email", async (req, res) => {
    try {
      if (!req.session.userId || req.session.userRole !== 'admin') {
        return res.status(403).json({ message: "Нет доступа" });
      }

      const { provider, email, password, host, port, secure, fromName } = req.body;
      
      let emailService;
      
      switch (provider) {
        case 'gmail':
          emailService = EmailServiceFactory.createGmailService(email, password);
          break;
        case 'yandex':
          emailService = EmailServiceFactory.createYandexService(email, password);
          break;
        case 'mailru':
          emailService = EmailServiceFactory.createMailRuService(email, password);
          break;
        case 'custom':
          const customConfig = {
            host,
            port,
            secure,
            auth: { user: email, pass: password },
            from: email
          };
          emailService = new (await import("./services/email-service")).EmailService(customConfig);
          break;
        default:
          return res.status(400).json({ success: false, error: "Неподдерживаемый провайдер" });
      }

      const testResult = await emailService.testConnection();
      
      if (testResult) {
        res.json({ success: true, message: "Подключение успешно" });
      } else {
        res.json({ success: false, error: "Ошибка подключения к почтовому серверу" });
      }
    } catch (error: any) {
      console.error('Ошибка тестирования email:', error);
      res.json({ success: false, error: error.message || "Ошибка тестирования подключения" });
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
    vip: packageMap['vip']?.discount || 0,
    standard: packageMap['standard']?.discount || 0,
    economy: packageMap['economy']?.discount || 0
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

async function generateSubscriptionTitle(template: string, calculation: any): Promise<string> {
  // Get package name in Russian
  const packageNames = {
    'vip': 'ВИП',
    'standard': 'Стандарт',
    'economy': 'Эконом'
  };
  
  const packageName = packageNames[calculation.packageType as keyof typeof packageNames] || calculation.packageType;
  
  // Generate unique number combination
  const uniqueNumber = await generateUniqueSubscriptionNumber();
  
  // Get service names from calculation
  const serviceNames = calculation.services.map((s: any) => s.title || s.name).join(', ');
  
  return `${uniqueNumber} ${serviceNames} - ${packageName}`;
}

async function generateUniqueSubscriptionNumber(): Promise<string> {
  const firstDigit = Math.floor(Math.random() * 4) + 1; // 1-4
  
  // Try to find unique combination
  for (let attempts = 0; attempts < 100; attempts++) {
    const secondPart = Math.floor(Math.random() * 1000); // 0-999
    const number = `${firstDigit}.${secondPart.toString().padStart(3, '0')}`;
    
    // Check if this number already exists
    const existing = await storage.findSubscriptionByNumber(number);
    if (!existing) {
      return number;
    }
  }
  
  // Fallback: use timestamp-based number
  const timestamp = Date.now().toString().slice(-3);
  return `${firstDigit}.${timestamp}`;
}

function getFreezePolicyForPackage(packageType: string): boolean {
  return packageType !== 'none'; // All packages allow freeze
}

function getFreezeLimitForPackage(packageType: string): number {
  const limits = {
    vip: 999, // Maximum allowed by Yclients
    standard: 180, // 6 months
    economy: 90 // 3 months
  };
  return (limits as any)[packageType] || 0;
}

// Generate unique offer number
async function generateUniqueOfferNumber(): Promise<string> {
  const prefix = 'VV';
  const year = new Date().getFullYear().toString().slice(-2);
  const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  // Find the highest number for this month
  const existingOffers = await storage.getOffersByMaster(1); // Get all offers
  const thisMonthPattern = new RegExp(`^${prefix}${year}${month}(\\d{3})$`);
  
  let maxNumber = 0;
  existingOffers.forEach(offer => {
    const match = offer.offerNumber.match(thisMonthPattern);
    if (match) {
      const num = parseInt(match[1]);
      if (num > maxNumber) maxNumber = num;
    }
  });
  
  const nextNumber = (maxNumber + 1).toString().padStart(3, '0');
  return `${prefix}${year}${month}${nextNumber}`;
}

// Generate payment schedule
function generatePaymentSchedule(
  downPayment: number, 
  finalCost: number, 
  installmentMonths?: number
): { date: string; amount: number; description: string }[] {
  const schedule = [];
  const today = new Date();
  
  // First payment (down payment)
  schedule.push({
    date: today.toLocaleDateString('ru-RU'),
    amount: downPayment,
    description: 'Первоначальный взнос'
  });
  
  // If there are installments
  if (installmentMonths && installmentMonths > 1) {
    const remainingAmount = finalCost - downPayment;
    const monthlyPayment = remainingAmount / installmentMonths;
    
    for (let i = 1; i <= installmentMonths; i++) {
      const paymentDate = new Date(today);
      paymentDate.setMonth(paymentDate.getMonth() + i);
      
      schedule.push({
        date: paymentDate.toLocaleDateString('ru-RU'),
        amount: monthlyPayment,
        description: `Платеж ${i} из ${installmentMonths}`
      });
    }
  }
  
  return schedule;
}