-- Add parcel reference columns to lead_intelligence table
-- Links leads to their associated parcel data from TxGIO/TNRIS

-- Add parcel_id foreign key reference
ALTER TABLE "lead_intelligence" ADD COLUMN IF NOT EXISTS "parcel_id" text;

--> statement-breakpoint

-- Add parcel_data JSONB for snapshot at analysis time
ALTER TABLE "lead_intelligence" ADD COLUMN IF NOT EXISTS "parcel_data" jsonb;

--> statement-breakpoint

-- Add foreign key constraint (SET NULL on delete to preserve lead_intelligence when parcel is removed)
ALTER TABLE "lead_intelligence"
  ADD CONSTRAINT "lead_intelligence_parcel_id_fkey"
  FOREIGN KEY ("parcel_id")
  REFERENCES "parcels"("id")
  ON DELETE SET NULL;

--> statement-breakpoint

-- Index for efficient joins
CREATE INDEX IF NOT EXISTS "lead_intelligence_parcel_id_idx" ON "lead_intelligence" USING btree ("parcel_id");
