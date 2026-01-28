CREATE TYPE "public"."condition" AS ENUM('excellent', 'good', 'fair', 'poor', 'needs_work');--> statement-breakpoint
CREATE TYPE "public"."lead_status" AS ENUM('new', 'analyzing', 'analyzed', 'contacted', 'archived');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('manufactured_home', 'mobile_home', 'land_only', 'improved_lot', 'tiny_house');--> statement-breakpoint
ALTER TYPE "public"."job_type" ADD VALUE 'lead_intelligence';--> statement-breakpoint
CREATE TABLE "lead_intelligence" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"has_water_ccn" jsonb DEFAULT 'false'::jsonb,
	"water_provider" text,
	"has_sewer_ccn" jsonb DEFAULT 'false'::jsonb,
	"sewer_provider" text,
	"flood_zone" text,
	"fmr_fiscal_year" integer,
	"fmr_two_bedroom" real,
	"suggested_lot_rent_low" real,
	"suggested_lot_rent_high" real,
	"median_household_income" real,
	"unemployment_rate" real,
	"population_growth_rate" real,
	"mobile_homes_percent" real,
	"nearby_parks_count" integer DEFAULT 0,
	"nearby_parks_data" jsonb DEFAULT '[]'::jsonb,
	"record_id" text,
	"owner_name" text,
	"manufacturer" text,
	"model_year" integer,
	"has_liens" jsonb DEFAULT 'false'::jsonb,
	"total_lien_amount" real,
	"ai_insights" jsonb DEFAULT '[]'::jsonb,
	"ai_risk_factors" jsonb DEFAULT '[]'::jsonb,
	"ai_opportunities" jsonb DEFAULT '[]'::jsonb,
	"ai_recommendation" text,
	"ai_confidence_score" real,
	"raw_responses" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_intelligence_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE "lead_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"lead_id" text NOT NULL,
	"report_type" text DEFAULT 'due_diligence' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"file_name" text,
	"file_size_bytes" integer,
	"generated_by" text DEFAULT 'system' NOT NULL,
	"file_url" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" "lead_status" DEFAULT 'new' NOT NULL,
	"address_raw" text NOT NULL,
	"address_normalized" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"county" text,
	"latitude" real,
	"longitude" real,
	"property_type" "property_type",
	"year_built" integer,
	"beds" integer,
	"baths" integer,
	"sqft" integer,
	"acreage" real,
	"condition" "condition",
	"condition_notes" text,
	"asking_price" real,
	"mortgage_balance" real,
	"taxes_owed" real,
	"estimated_repairs" real,
	"seller_name" text,
	"seller_phone" text,
	"seller_email" text,
	"seller_motivation" text,
	"seller_timeframe" text,
	"lead_source" text,
	"features" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"analyzed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "lead_intelligence" ADD CONSTRAINT "lead_intelligence_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_reports" ADD CONSTRAINT "lead_reports_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lead_intelligence_lead_id_idx" ON "lead_intelligence" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_intelligence_created_at_idx" ON "lead_intelligence" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lead_reports_lead_id_idx" ON "lead_reports" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_reports_created_at_idx" ON "lead_reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_user_id_idx" ON "leads" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" USING btree ("status");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "leads_zip_code_idx" ON "leads" USING btree ("zip_code");