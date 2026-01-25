CREATE TABLE "bls_employment" (
	"id" text PRIMARY KEY NOT NULL,
	"area_code" text NOT NULL,
	"area_name" text NOT NULL,
	"area_type" text,
	"state_code" text,
	"county_code" text,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"period_type" text DEFAULT 'monthly' NOT NULL,
	"labor_force" integer,
	"employed" integer,
	"unemployed" integer,
	"unemployment_rate" real,
	"is_preliminary" text DEFAULT 'N',
	"source_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "census_demographics" (
	"id" text PRIMARY KEY NOT NULL,
	"geo_id" text NOT NULL,
	"geo_type" text NOT NULL,
	"geo_name" text NOT NULL,
	"state_code" text,
	"county_code" text,
	"survey_year" integer NOT NULL,
	"total_population" integer,
	"population_growth_rate" real,
	"median_age" real,
	"median_household_income" integer,
	"per_capita_income" integer,
	"poverty_rate" real,
	"total_housing_units" integer,
	"occupied_housing_units" integer,
	"vacancy_rate" real,
	"owner_occupied_rate" real,
	"renter_occupied_rate" real,
	"median_home_value" integer,
	"median_gross_rent" integer,
	"mobile_homes_count" integer,
	"mobile_homes_percent" real,
	"high_school_grad_rate" real,
	"bachelors_degree_rate" real,
	"source_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hud_fair_market_rents" (
	"id" text PRIMARY KEY NOT NULL,
	"zip_code" text NOT NULL,
	"county_name" text,
	"metro_name" text,
	"state_name" text,
	"state_code" text,
	"fiscal_year" integer NOT NULL,
	"efficiency" integer,
	"one_bedroom" integer,
	"two_bedroom" integer,
	"three_bedroom" integer,
	"four_bedroom" integer,
	"small_area_status" text,
	"source_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "bls_area_year_month_idx" ON "bls_employment" USING btree ("area_code","year","month");--> statement-breakpoint
CREATE INDEX "bls_county_code_idx" ON "bls_employment" USING btree ("county_code");--> statement-breakpoint
CREATE INDEX "bls_state_code_idx" ON "bls_employment" USING btree ("state_code");--> statement-breakpoint
CREATE INDEX "bls_year_month_idx" ON "bls_employment" USING btree ("year","month");--> statement-breakpoint
CREATE INDEX "cen_geo_survey_year_idx" ON "census_demographics" USING btree ("geo_id","survey_year");--> statement-breakpoint
CREATE INDEX "cen_county_code_idx" ON "census_demographics" USING btree ("county_code");--> statement-breakpoint
CREATE INDEX "cen_geo_type_idx" ON "census_demographics" USING btree ("geo_type");--> statement-breakpoint
CREATE INDEX "cen_state_code_idx" ON "census_demographics" USING btree ("state_code");--> statement-breakpoint
CREATE INDEX "hfr_zip_fiscal_year_idx" ON "hud_fair_market_rents" USING btree ("zip_code","fiscal_year");--> statement-breakpoint
CREATE INDEX "hfr_county_name_idx" ON "hud_fair_market_rents" USING btree ("county_name");--> statement-breakpoint
CREATE INDEX "hfr_state_code_idx" ON "hud_fair_market_rents" USING btree ("state_code");