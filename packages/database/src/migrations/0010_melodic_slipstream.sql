CREATE TYPE "public"."lead_status" AS ENUM('new', 'analyzing', 'analyzed', 'interested', 'passed', 'in_progress', 'closed', 'dead');--> statement-breakpoint
CREATE TYPE "public"."property_condition" AS ENUM('excellent', 'good', 'average', 'fair', 'poor', 'needs_rehab', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('singlewide', 'doublewide', 'land_only', 'land_with_home', 'park', 'other');--> statement-breakpoint
CREATE TABLE "lead_intelligence" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"water_ccn" jsonb,
	"sewer_ccn" jsonb,
	"has_water_coverage" boolean,
	"has_sewer_coverage" boolean,
	"flood_zone" text,
	"flood_zone_description" text,
	"is_high_risk_flood" boolean,
	"fmr_data" jsonb,
	"demographics" jsonb,
	"tdhca_match" jsonb,
	"nearby_parks" jsonb,
	"ai_analysis" jsonb,
	"ai_analyzed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_intelligence_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "lead_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"file_name" text NOT NULL,
	"report_data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"org_id" text,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"address" text NOT NULL,
	"city" text,
	"county" text,
	"state" text DEFAULT 'TX',
	"zip_code" text,
	"latitude" real,
	"longitude" real,
	"property_type" "property_type",
	"property_condition" "property_condition",
	"year_built" integer,
	"lot_size" real,
	"home_size" real,
	"bedrooms" integer,
	"bathrooms" real,
	"lot_count" integer,
	"asking_price" integer,
	"estimated_value" integer,
	"lot_rent" integer,
	"monthly_income" integer,
	"annual_taxes" integer,
	"annual_insurance" integer,
	"seller_name" text,
	"seller_phone" text,
	"seller_email" text,
	"seller_motivation" text,
	"lead_source" text,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"analyzed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "lead_intelligence" ADD CONSTRAINT "lead_intelligence_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_reports" ADD CONSTRAINT "lead_reports_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_intelligence_lead_id_idx" ON "lead_intelligence" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_reports_lead_id_idx" ON "lead_reports" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "leads_user_id_idx" ON "leads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_county_idx" ON "leads" USING btree ("county");--> statement-breakpoint
CREATE INDEX "leads_zip_code_idx" ON "leads" USING btree ("zip_code");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_property_type_idx" ON "leads" USING btree ("property_type");