-- Parcels table for TxGIO/TNRIS StratMap Land Parcels data
-- Data is fetched on-demand via TxGIO ArcGIS REST API and cached locally
-- Source: https://tnris.org/stratmap/land-parcels.html

CREATE TABLE IF NOT EXISTS "parcels" (
	"id" text PRIMARY KEY NOT NULL,

	-- TxGIO identifiers
	"prop_id" text NOT NULL,
	"geo_id" text,
	"county" text NOT NULL,
	"fips" text,

	-- Owner info
	"owner_name" text,
	"owner_care_of" text,

	-- Property address (situs)
	"situs_address" text,
	"situs_city" text,
	"situs_state" text DEFAULT 'TX',
	"situs_zip" text,

	-- Mailing address
	"mail_address" text,
	"mail_city" text,
	"mail_state" text,
	"mail_zip" text,

	-- Legal description
	"legal_description" text,
	"legal_area" double precision,
	"legal_area_unit" text,

	-- Assessed values
	"land_value" double precision,
	"improvement_value" double precision,
	"market_value" double precision,
	"tax_year" text,

	-- Land use codes
	"state_land_use" text,
	"local_land_use" text,

	-- Geometry (PostGIS GEOGRAPHY type for accurate distance/area calculations)
	"boundary" GEOGRAPHY(POLYGON, 4326),
	"gis_area" double precision,

	-- Metadata
	"source_updated_at" timestamp with time zone,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint

-- Unique constraint: same property ID can exist across counties but must be unique within county
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_prop_id_county_unique" UNIQUE ("prop_id", "county");

--> statement-breakpoint

-- Spatial index for efficient geographic queries (point-in-polygon, bounding box)
CREATE INDEX IF NOT EXISTS "parcels_boundary_gist_idx" ON "parcels" USING GIST ("boundary");

--> statement-breakpoint

-- Regular indexes for common lookups
CREATE INDEX IF NOT EXISTS "parcels_county_idx" ON "parcels" USING btree ("county");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "parcels_situs_zip_idx" ON "parcels" USING btree ("situs_zip");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "parcels_owner_name_idx" ON "parcels" USING btree ("owner_name");

--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "parcels_prop_id_idx" ON "parcels" USING btree ("prop_id");
