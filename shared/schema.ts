import { pgTable, text, serial, integer, boolean, timestamp, json, decimal, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users and Authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  pin: varchar("pin", { length: 6 }).notNull().unique(),
  role: text("role").notNull(), // 'master' | 'admin'
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Configuration
export const config = pgTable("config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: json("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Yclients Services Cache
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  yclientsId: integer("yclients_id").notNull().unique(),
  title: text("title").notNull(),
  priceMin: decimal("price_min", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id"),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Yclients Subscription Types Cache
export const subscriptionTypes = pgTable("subscription_types", {
  id: serial("id").primaryKey(),
  yclientsId: integer("yclients_id").notNull().unique(),
  title: text("title").notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  allowFreeze: boolean("allow_freeze").default(false),
  freezeLimit: integer("freeze_limit").default(0),
  balanceContainer: json("balance_container"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Package Configuration
export const packages = pgTable("packages", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().unique(), // 'vip' | 'standard' | 'economy'
  name: text("name").notNull(),
  discount: decimal("discount", { precision: 3, scale: 2 }).notNull(), // 0.20 for 20%
  minCost: decimal("min_cost", { precision: 10, scale: 2 }).notNull(),
  minDownPaymentPercent: decimal("min_down_payment_percent", { precision: 3, scale: 2 }).notNull(), // 0.50 for 50%
  requiresFullPayment: boolean("requires_full_payment").default(false),
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Package Perks
export const packagePerks = pgTable("package_perks", {
  id: serial("id").primaryKey(),
  packageType: text("package_type").notNull().references(() => packages.type),
  name: text("name").notNull(),
  icon: text("icon").notNull(), // Lucide icon name
  isActive: boolean("is_active").default(true),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: text("email"),
  yclientsId: integer("yclients_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Sales
export const sales = pgTable("sales", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id),
  masterId: integer("master_id").references(() => users.id),
  subscriptionTypeId: integer("subscription_type_id").references(() => subscriptionTypes.id),
  selectedServices: json("selected_services").notNull(), // array of {serviceId, quantity}
  selectedPackage: text("selected_package").notNull(), // 'vip' | 'standard' | 'economy'
  baseCost: decimal("base_cost", { precision: 10, scale: 2 }).notNull(),
  finalCost: decimal("final_cost", { precision: 10, scale: 2 }).notNull(),
  totalSavings: decimal("total_savings", { precision: 10, scale: 2 }).notNull(),
  downPayment: decimal("down_payment", { precision: 10, scale: 2 }).notNull(),
  installmentMonths: integer("installment_months"),
  monthlyPayment: decimal("monthly_payment", { precision: 10, scale: 2 }),
  appliedDiscounts: json("applied_discounts"), // array of discount details
  freeZones: json("free_zones"), // array of free zone details
  usedCertificate: boolean("used_certificate").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const salesRelations = relations(sales, ({ one }) => ({
  client: one(clients, {
    fields: [sales.clientId],
    references: [clients.id],
  }),
  master: one(users, {
    fields: [sales.masterId],
    references: [users.id],
  }),
  subscriptionType: one(subscriptionTypes, {
    fields: [sales.subscriptionTypeId],
    references: [subscriptionTypes.id],
  }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  sales: many(sales),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sales: many(sales),
}));

export const packagesRelations = relations(packages, ({ many }) => ({
  perks: many(packagePerks),
}));

export const packagePerksRelations = relations(packagePerks, ({ one }) => ({
  package: one(packages, {
    fields: [packagePerks.packageType],
    references: [packages.type],
  }),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertConfigSchema = createInsertSchema(config).omit({ id: true, updatedAt: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true, updatedAt: true });
export const insertSubscriptionTypeSchema = createInsertSchema(subscriptionTypes).omit({ id: true, updatedAt: true });
export const insertPackageSchema = createInsertSchema(packages).omit({ id: true, updatedAt: true });
export const insertPackagePerkSchema = createInsertSchema(packagePerks).omit({ id: true, updatedAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Config = typeof config.$inferSelect;
export type InsertConfig = z.infer<typeof insertConfigSchema>;
export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;
export type SubscriptionType = typeof subscriptionTypes.$inferSelect;
export type InsertSubscriptionType = z.infer<typeof insertSubscriptionTypeSchema>;
export type Package = typeof packages.$inferSelect;
export type InsertPackage = z.infer<typeof insertPackageSchema>;
export type PackagePerk = typeof packagePerks.$inferSelect;
export type InsertPackagePerk = z.infer<typeof insertPackagePerkSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
