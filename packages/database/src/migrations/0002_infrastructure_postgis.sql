-- Enable PostGIS extension (must be enabled in Neon console first for serverless)
CREATE EXTENSION IF NOT EXISTS postgis;

--> statement-breakpoint

-- CCN Areas table for water/sewer utility service boundaries
CREATE TABLE IF NOT EXISTS "ccn_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"ccn_number" text,
	"utility_name" text NOT NULL,
	"service_type" text NOT NULL,
	"county" text,
	"boundary" GEOGRAPHY(POLYGON, 4326),
	"source_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Flood Zones table for FEMA NFHL data
CREATE TABLE IF NOT EXISTS "flood_zones" (
	"id" text PRIMARY KEY NOT NULL,
	"zone_code" text NOT NULL,
	"zone_description" text,
	"county" text,
	"boundary" GEOGRAPHY(MULTIPOLYGON, 4326),
	"effective_date" timestamp with time zone,
	"source_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Create spatial indexes for efficient geographic queries
CREATE INDEX IF NOT EXISTS "ccn_areas_boundary_gist_idx" ON "ccn_areas" USING GIST ("boundary");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "flood_zones_boundary_gist_idx" ON "flood_zones" USING GIST ("boundary");

--> statement-breakpoint

-- Create regular indexes for common queries
CREATE INDEX IF NOT EXISTS "ccn_areas_county_idx" ON "ccn_areas" USING btree ("county");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ccn_areas_service_type_idx" ON "ccn_areas" USING btree ("service_type");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ccn_areas_utility_name_idx" ON "ccn_areas" USING btree ("utility_name");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "flood_zones_county_idx" ON "flood_zones" USING btree ("county");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "flood_zones_zone_code_idx" ON "flood_zones" USING btree ("zone_code");
