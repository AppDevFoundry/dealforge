-- CCN Facilities table for water/sewer utility infrastructure lines
-- Uses GEOGRAPHY(GEOMETRY, 4326) to support both LineString and MultiLineString

CREATE TABLE IF NOT EXISTS "ccn_facilities" (
	"id" text PRIMARY KEY NOT NULL,
	"ccn_number" text,
	"utility_name" text NOT NULL,
	"service_type" text NOT NULL,
	"county" text,
	"geometry" GEOGRAPHY(GEOMETRY, 4326),
	"source_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Create spatial index for efficient geographic queries
CREATE INDEX IF NOT EXISTS "ccn_facilities_geometry_gist_idx" ON "ccn_facilities" USING GIST ("geometry");

--> statement-breakpoint

-- Create regular indexes for common queries
CREATE INDEX IF NOT EXISTS "ccn_facilities_county_idx" ON "ccn_facilities" USING btree ("county");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ccn_facilities_service_type_idx" ON "ccn_facilities" USING btree ("service_type");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "ccn_facilities_utility_name_idx" ON "ccn_facilities" USING btree ("utility_name");
