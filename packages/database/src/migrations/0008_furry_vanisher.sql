DROP INDEX "bls_area_year_month_idx";--> statement-breakpoint
DROP INDEX "cen_geo_survey_year_idx";--> statement-breakpoint
DROP INDEX "hfr_zip_fiscal_year_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "bls_area_year_month_idx" ON "bls_employment" USING btree ("area_code","year","month");--> statement-breakpoint
CREATE UNIQUE INDEX "cen_geo_survey_year_idx" ON "census_demographics" USING btree ("geo_id","survey_year");--> statement-breakpoint
CREATE UNIQUE INDEX "hfr_zip_fiscal_year_idx" ON "hud_fair_market_rents" USING btree ("zip_code","fiscal_year");