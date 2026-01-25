DROP INDEX "hfr_zip_fiscal_year_idx";--> statement-breakpoint
ALTER TABLE "hud_fair_market_rents" ALTER COLUMN "zip_code" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hud_fair_market_rents" ADD COLUMN "entity_code" text;--> statement-breakpoint
CREATE UNIQUE INDEX "hfr_entity_fiscal_year_idx" ON "hud_fair_market_rents" USING btree ("entity_code","fiscal_year");--> statement-breakpoint
CREATE INDEX "hfr_metro_name_idx" ON "hud_fair_market_rents" USING btree ("metro_name");--> statement-breakpoint
CREATE INDEX "hfr_zip_fiscal_year_idx" ON "hud_fair_market_rents" USING btree ("zip_code","fiscal_year");