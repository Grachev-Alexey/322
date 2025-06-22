import { 
  users, config, services, subscriptionTypes, clients, sales, packages, packagePerks,
  type User, type InsertUser, type Config, type InsertConfig,
  type Service, type InsertService, type SubscriptionType, type InsertSubscriptionType,
  type Package, type InsertPackage, type PackagePerk, type InsertPackagePerk,
  type Client, type InsertClient, type Sale, type InsertSale
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUserByPin(pin: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<void>;
  getUserCount(): Promise<number>;
  
  // Config
  getConfig(key: string): Promise<Config | undefined>;
  setConfig(key: string, value: any): Promise<Config>;
  
  // Services
  getActiveServices(): Promise<Service[]>;
  getAllServices(): Promise<Service[]>;
  upsertService(service: InsertService): Promise<Service>;
  updateServiceStatus(yclientsId: number, isActive: boolean): Promise<void>;
  
  // Subscription Types
  getSubscriptionTypes(): Promise<SubscriptionType[]>;
  upsertSubscriptionType(subscriptionType: InsertSubscriptionType): Promise<SubscriptionType>;
  findSubscriptionType(services: any[], cost: number, packageType: string): Promise<SubscriptionType | undefined>;
  
  // Packages
  getPackages(): Promise<Package[]>;
  upsertPackage(pkg: InsertPackage): Promise<Package>;
  getPackagePerks(packageType: string): Promise<PackagePerk[]>;
  upsertPackagePerk(perk: InsertPackagePerk): Promise<PackagePerk>;
  getPackageCount(): Promise<number>;
  
  // Initialization
  initializeDefaultData(): Promise<void>;
  
  // Clients
  getClientByPhone(phone: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  
  // Sales
  createSale(sale: InsertSale): Promise<Sale>;
  getSalesByMaster(masterId: number): Promise<Sale[]>;
  getSalesStats(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUserByPin(pin: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.pin, pin));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async getUserCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(users);
    return Number(result[0].count);
  }

  // Config
  async getConfig(key: string): Promise<Config | undefined> {
    const [configItem] = await db.select().from(config).where(eq(config.key, key));
    return configItem || undefined;
  }

  async setConfig(key: string, value: any): Promise<Config> {
    const [configItem] = await db
      .insert(config)
      .values({ key, value })
      .onConflictDoUpdate({
        target: config.key,
        set: { value, updatedAt: new Date() }
      })
      .returning();
    return configItem;
  }

  // Services
  async getActiveServices(): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.isActive, true));
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services);
  }

  async upsertService(service: InsertService): Promise<Service> {
    const [serviceItem] = await db
      .insert(services)
      .values(service)
      .onConflictDoUpdate({
        target: services.yclientsId,
        set: { ...service, updatedAt: new Date() }
      })
      .returning();
    return serviceItem;
  }

  async updateServiceStatus(yclientsId: number, isActive: boolean): Promise<void> {
    await db.update(services)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(services.yclientsId, yclientsId));
  }

  // Subscription Types
  async getSubscriptionTypes(): Promise<SubscriptionType[]> {
    return await db.select().from(subscriptionTypes);
  }

  async upsertSubscriptionType(subscriptionType: InsertSubscriptionType): Promise<SubscriptionType> {
    const [subscriptionTypeItem] = await db
      .insert(subscriptionTypes)
      .values(subscriptionType)
      .onConflictDoUpdate({
        target: subscriptionTypes.yclientsId,
        set: { ...subscriptionType, updatedAt: new Date() }
      })
      .returning();
    return subscriptionTypeItem;
  }

  async findSubscriptionType(services: any[], cost: number, packageType: string): Promise<SubscriptionType | undefined> {
    // This would implement complex matching logic based on services composition and package parameters
    // For now, return undefined to trigger creation of new subscription type
    return undefined;
  }

  // Clients
  async getClientByPhone(phone: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.phone, phone));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [clientItem] = await db.insert(clients).values(client).returning();
    return clientItem;
  }

  // Sales
  async createSale(sale: InsertSale): Promise<Sale> {
    const [saleItem] = await db.insert(sales).values(sale).returning();
    return saleItem;
  }

  async getSalesByMaster(masterId: number): Promise<Sale[]> {
    return await db.select().from(sales).where(eq(sales.masterId, masterId));
  }

  async getSalesStats(): Promise<any> {
    // Implementation for sales statistics
    return {};
  }

  // Packages
  async getPackages(): Promise<Package[]> {
    return await db.select().from(packages).where(eq(packages.isActive, true));
  }

  async upsertPackage(pkg: InsertPackage): Promise<Package> {
    const [existing] = await db.select().from(packages).where(eq(packages.type, pkg.type));
    if (existing) {
      const [updated] = await db.update(packages)
        .set(pkg)
        .where(eq(packages.type, pkg.type))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(packages).values(pkg).returning();
      return created;
    }
  }

  async getPackagePerks(packageType: string): Promise<PackagePerk[]> {
    return await db.select().from(packagePerks)
      .where(and(eq(packagePerks.packageType, packageType), eq(packagePerks.isActive, true)));
  }

  async upsertPackagePerk(perk: InsertPackagePerk & { id?: number }): Promise<PackagePerk> {
    // If we have an ID, update existing perk
    if (perk.id) {
      const [updated] = await db.update(packagePerks)
        .set({
          packageType: perk.packageType,
          name: perk.name,
          icon: perk.icon,
          displayType: perk.displayType || 'simple',
          textColor: perk.textColor || '#6B7280',
          iconColor: perk.iconColor || '#6B7280',
          isActive: perk.isActive
        })
        .where(eq(packagePerks.id, perk.id))
        .returning();
      return updated;
    }
    
    // Otherwise, create new perk
    const [created] = await db.insert(packagePerks).values({
      packageType: perk.packageType,
      name: perk.name,
      icon: perk.icon,
      displayType: perk.displayType || 'simple',
      textColor: perk.textColor || '#6B7280',
      iconColor: perk.iconColor || '#6B7280',
      isActive: perk.isActive
    }).returning();
    return created;
  }

  async deletePackagePerk(id: number): Promise<void> {
    await db.delete(packagePerks).where(eq(packagePerks.id, id));
  }

  async getPackageCount(): Promise<number> {
    const result = await db.select({ count: sql`count(*)` }).from(packages);
    return Number(result[0].count);
  }

  async initializeDefaultData(): Promise<void> {
    // Check if we need to create default admin user
    const userCount = await this.getUserCount();
    if (userCount === 0) {
      await this.createUser({
        pin: "7571",
        role: "admin",
        name: "Администратор",
        isActive: true
      });
    }

    // Check if we need to create default packages
    const packageCount = await this.getPackageCount();
    if (packageCount === 0) {
      // Create VIP package
      await this.upsertPackage({
        type: "vip",
        name: "VIP",
        discount: "0.25",
        minCost: "50000",
        minDownPaymentPercent: "0.30",
        requiresFullPayment: false,
        giftSessions: 2,
        isActive: true
      });

      // Create Standard package
      await this.upsertPackage({
        type: "standard",
        name: "Стандарт",
        discount: "0.15",
        minCost: "30000",
        minDownPaymentPercent: "0.50",
        requiresFullPayment: false,
        giftSessions: 1,
        isActive: true
      });

      // Create Economy package
      await this.upsertPackage({
        type: "economy",
        name: "Эконом",
        discount: "0.10",
        minCost: "15000",
        minDownPaymentPercent: "0.70",
        requiresFullPayment: true,
        giftSessions: 0,
        isActive: true
      });

      // Create default perks for VIP
      const vipPerks = [
        { name: "Бесплатная консультация", icon: "UserCheck", displayType: "simple", textColor: "#10B981", iconColor: "#10B981" },
        { name: "2 бесплатные процедуры", icon: "Gift", displayType: "highlighted", textColor: "#F59E0B", iconColor: "#F59E0B" },
        { name: "Скидка 25%", icon: "Percent", displayType: "with_value", textColor: "#EF4444", iconColor: "#EF4444" },
        { name: "Приоритетная запись", icon: "Clock", displayType: "simple", textColor: "#8B5CF6", iconColor: "#8B5CF6" }
      ];

      for (const perk of vipPerks) {
        await this.upsertPackagePerk({
          packageType: "vip",
          ...perk,
          isActive: true
        });
      }

      // Create default perks for Standard
      const standardPerks = [
        { name: "Бесплатная консультация", icon: "UserCheck", displayType: "simple", textColor: "#10B981", iconColor: "#10B981" },
        { name: "1 бесплатная процедура", icon: "Gift", displayType: "highlighted", textColor: "#F59E0B", iconColor: "#F59E0B" },
        { name: "Скидка 15%", icon: "Percent", displayType: "with_value", textColor: "#3B82F6", iconColor: "#3B82F6" }
      ];

      for (const perk of standardPerks) {
        await this.upsertPackagePerk({
          packageType: "standard",
          ...perk,
          isActive: true
        });
      }

      // Create default perks for Economy
      const economyPerks = [
        { name: "Бесплатная консультация", icon: "UserCheck", displayType: "simple", textColor: "#10B981", iconColor: "#10B981" },
        { name: "Скидка 10%", icon: "Percent", displayType: "with_value", textColor: "#6B7280", iconColor: "#6B7280" }
      ];

      for (const perk of economyPerks) {
        await this.upsertPackagePerk({
          packageType: "economy",
          ...perk,
          isActive: true
        });
      }
    }
  }
}

export const storage = new DatabaseStorage();
