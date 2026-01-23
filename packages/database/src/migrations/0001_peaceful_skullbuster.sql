CREATE TABLE IF NOT EXISTS "mh_communities" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text NOT NULL,
	"county" text NOT NULL,
	"state" text DEFAULT 'TX' NOT NULL,
	"zip_code" text,
	"latitude" real,
	"longitude" real,
	"lot_count" integer,
	"estimated_occupancy" real,
	"property_type" text,
	"owner_name" text,
	"source" text NOT NULL,
	"source_updated_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "mh_titlings" (
	"id" text PRIMARY KEY NOT NULL,
	"county" text NOT NULL,
	"month" timestamp with time zone NOT NULL,
	"new_titles" integer DEFAULT 0 NOT NULL,
	"transfers" integer DEFAULT 0 NOT NULL,
	"total_active" integer,
	"source" text DEFAULT 'tdhca' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "texas_counties" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"fips_code" text NOT NULL,
	"region" text,
	"center_lat" real,
	"center_lng" real,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "texas_counties_name_unique" UNIQUE("name"),
	CONSTRAINT "texas_counties_fips_code_unique" UNIQUE("fips_code")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mh_communities_county_idx" ON "mh_communities" USING btree ("county");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mh_communities_city_idx" ON "mh_communities" USING btree ("city");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mh_communities_lot_count_idx" ON "mh_communities" USING btree ("lot_count");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mh_titlings_county_idx" ON "mh_titlings" USING btree ("county");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "mh_titlings_month_idx" ON "mh_titlings" USING btree ("month");