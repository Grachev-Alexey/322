import { 
  users, config, services, subscriptionTypes, clients, sales, packages, perks, packagePerkValues,
  type User, type InsertUser, type Config, type InsertConfig,
  type Service, type InsertService, type SubscriptionType, type InsertSubscriptionType,
  type Package, type InsertPackage, type Perk, type InsertPerk,
  type PackagePerkValue, type InsertPackagePerkValue,
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
  getPackageCount(): Promise<number>;
  
  // Perks
  getPerks(): Promise<Perk[]>;
  createPerk(perk: InsertPerk): Promise<Perk>;
  updatePerk(id: number, updates: Partial<InsertPerk>): Promise<Perk | null>;
  getPackagePerkValues(): Promise<(PackagePerkValue & { perk: Perk })[]>;
  createPackagePerkValue(perkValue: InsertPackagePerkValue): Promise<PackagePerkValue>;
  updatePackagePerkValue(id: number, updates: Partial<InsertPackagePerkValue>): Promise<PackagePerkValue | null>;
  
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

  // Universal Perks
  async getPerks(): Promise<Perk[]> {
    return await db.select().from(perks)
      .where(eq(perks.isActive, true))
      .orderBy(perks.displayOrder, perks.id);
  }

  async createPerk(perk: InsertPerk): Promise<Perk> {
    const [newPerk] = await db.insert(perks).values(perk).returning();
    return newPerk;
  }

  async updatePerk(id: number, updates: Partial<InsertPerk>): Promise<Perk | null> {
    const [updated] = await db.update(perks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(perks.id, id))
      .returning();
    return updated || null;
  }

  async getPackagePerkValues(): Promise<(PackagePerkValue & { perk: Perk })[]> {
    return await db.select({
      id: packagePerkValues.id,
      packageType: packagePerkValues.packageType,
      perkId: packagePerkValues.perkId,
      valueType: packagePerkValues.valueType,
      booleanValue: packagePerkValues.booleanValue,
      textValue: packagePerkValues.textValue,
      numberValue: packagePerkValues.numberValue,
      displayValue: packagePerkValues.displayValue,
      isHighlighted: packagePerkValues.isHighlighted,
      isActive: packagePerkValues.isActive,
      updatedAt: packagePerkValues.updatedAt,
      perk: {
        id: perks.id,
        name: perks.name,
        description: perks.description,
        icon: perks.icon,
        displayOrder: perks.displayOrder,
        isActive: perks.isActive,
        updatedAt: perks.updatedAt,
      }
    })
    .from(packagePerkValues)
    .innerJoin(perks, eq(packagePerkValues.perkId, perks.id))
    .where(and(eq(packagePerkValues.isActive, true), eq(perks.isActive, true)))
    .orderBy(perks.displayOrder, perks.id);
  }

  async createPackagePerkValue(perkValue: InsertPackagePerkValue): Promise<PackagePerkValue> {
    const [newPerkValue] = await db.insert(packagePerkValues).values(perkValue).returning();
    return newPerkValue;
  }

  async deletePerk(perkId: number): Promise<void> {
    // First delete all perk values for this perk
    await db.delete(packagePerkValues).where(eq(packagePerkValues.perkId, perkId));
    // Then delete the perk itself
    await db.delete(perks).where(eq(perks.id, perkId));
  }

  async updatePackagePerkValue(id: number, updates: Partial<InsertPackagePerkValue>): Promise<PackagePerkValue | null> {
    const [updated] = await db.update(packagePerkValues)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(packagePerkValues.id, id))
      .returning();
    return updated || null;
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

      // Default perks and values are now created via SQL inserts above
    }
  }
}

export const storage = new DatabaseStorage();
