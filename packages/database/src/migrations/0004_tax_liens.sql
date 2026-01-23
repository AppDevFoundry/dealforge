-- Tax Liens table for TDHCA manufactured home tax lien records
CREATE TABLE IF NOT EXISTS "mh_tax_liens" (
  "id" text PRIMARY KEY NOT NULL,
  "serial_number" text,
  "hud_label" text,
  "county" text NOT NULL,
  "taxing_entity" text,
  "amount" real,
  "year" integer,
  "status" text NOT NULL,
  "filed_date" timestamp with time zone,
  "released_date" timestamp with time zone,
  "community_id" text REFERENCES "mh_communities"("id"),
  "source_updated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "mh_tax_liens_county_idx" ON "mh_tax_liens"("county");
CREATE INDEX IF NOT EXISTS "mh_tax_liens_status_idx" ON "mh_tax_liens"("status");
CREATE INDEX IF NOT EXISTS "mh_tax_liens_serial_number_idx" ON "mh_tax_liens"("serial_number");
CREATE INDEX IF NOT EXISTS "mh_tax_liens_community_id_idx" ON "mh_tax_liens"("community_id");
