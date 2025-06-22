CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" text,
	"yclients_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "config" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" json NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "package_perk_values" (
	"id" serial PRIMARY KEY NOT NULL,
	"package_type" text NOT NULL,
	"perk_id" integer NOT NULL,
	"value_type" text NOT NULL,
	"boolean_value" boolean,
	"text_value" text,
	"number_value" numeric(10, 2),
	"display_value" text NOT NULL,
	"is_highlighted" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"discount" numeric(3, 2) NOT NULL,
	"min_cost" numeric(10, 2) NOT NULL,
	"min_down_payment_percent" numeric(3, 2) NOT NULL,
	"requires_full_payment" boolean DEFAULT false,
	"gift_sessions" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "packages_type_unique" UNIQUE("type")
);
--> statement-breakpoint
CREATE TABLE "perks" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text NOT NULL,
	"display_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer,
	"master_id" integer,
	"subscription_type_id" integer,
	"selected_services" json NOT NULL,
	"selected_package" text NOT NULL,
	"base_cost" numeric(10, 2) NOT NULL,
	"final_cost" numeric(10, 2) NOT NULL,
	"total_savings" numeric(10, 2) NOT NULL,
	"down_payment" numeric(10, 2) NOT NULL,
	"installment_months" integer,
	"monthly_payment" numeric(10, 2),
	"applied_discounts" json,
	"free_zones" json,
	"used_certificate" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"yclients_id" integer NOT NULL,
	"title" text NOT NULL,
	"price_min" numeric(10, 2) NOT NULL,
	"category_id" integer,
	"is_active" boolean DEFAULT true,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "services_yclients_id_unique" UNIQUE("yclients_id")
);
--> statement-breakpoint
CREATE TABLE "subscription_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"yclients_id" integer NOT NULL,
	"title" text NOT NULL,
	"cost" numeric(10, 2) NOT NULL,
	"allow_freeze" boolean DEFAULT false,
	"freeze_limit" integer DEFAULT 0,
	"balance_container" json,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subscription_types_yclients_id_unique" UNIQUE("yclients_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"pin" varchar(6) NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_pin_unique" UNIQUE("pin")
);
--> statement-breakpoint
ALTER TABLE "package_perk_values" ADD CONSTRAINT "package_perk_values_package_type_packages_type_fk" FOREIGN KEY ("package_type") REFERENCES "public"."packages"("type") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_perk_values" ADD CONSTRAINT "package_perk_values_perk_id_perks_id_fk" FOREIGN KEY ("perk_id") REFERENCES "public"."perks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_master_id_users_id_fk" FOREIGN KEY ("master_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_subscription_type_id_subscription_types_id_fk" FOREIGN KEY ("subscription_type_id") REFERENCES "public"."subscription_types"("id") ON DELETE no action ON UPDATE no action;