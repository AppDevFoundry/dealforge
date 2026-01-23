-- TDHCA MH Ownership Records table
CREATE TABLE IF NOT EXISTS "mh_ownership_records" (
	"id" text PRIMARY KEY NOT NULL,
	"certificate_number" text NOT NULL,
	"label" text,
	"serial_number" text,
	"manufacturer_name" text,
	"model" text,
	"manufacture_date" text,
	"sections" integer,
	"square_feet" integer,
	"sale_date" text,
	"seller_name" text,
	"owner_name" text,
	"owner_address" text,
	"owner_city" text,
	"owner_state" text,
	"owner_zip" text,
	"install_county" text,
	"install_address" text,
	"install_city" text,
	"install_state" text,
	"install_zip" text,
	"wind_zone" text,
	"issue_date" text,
	"election_type" text,
	"lien_holder_1" text,
	"lien_date_1" text,
	"source_file" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mh_ownership_records_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint

-- TDHCA MH Tax Liens table
CREATE TABLE IF NOT EXISTS "mh_tax_liens" (
	"id" text PRIMARY KEY NOT NULL,
	"tax_roll_number" text,
	"payer_name" text,
	"payer_address" text,
	"payer_city" text,
	"label" text,
	"serial_number" text,
	"county" text,
	"tax_unit_id" text,
	"tax_unit_name" text,
	"tax_year" integer,
	"lien_date" text,
	"release_date" text,
	"tax_amount" real,
	"status" text,
	"source_file" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

-- Indexes for ownership records
CREATE INDEX IF NOT EXISTS "idx_ownership_install_county" ON "mh_ownership_records" USING btree ("install_county");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ownership_install_address" ON "mh_ownership_records" USING btree ("install_address");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_ownership_cert_num" ON "mh_ownership_records" USING btree ("certificate_number");
--> statement-breakpoint

-- Indexes for tax liens
CREATE INDEX IF NOT EXISTS "idx_taxliens_county" ON "mh_tax_liens" USING btree ("county");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_taxliens_serial" ON "mh_tax_liens" USING btree ("serial_number");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_taxliens_label" ON "mh_tax_liens" USING btree ("label");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_taxliens_tax_year" ON "mh_tax_liens" USING btree ("tax_year");
