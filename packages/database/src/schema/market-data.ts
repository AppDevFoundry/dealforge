import { index, integer, pgTable, real, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * HUD Fair Market Rents table
 *
 * Stores HUD Fair Market Rent data at multiple geographic levels:
 * - Metro area level (entityCode like 'METRO10180M10180')
 * - County level (entityCode like 'COUNTY48001')
 * - ZIP code level (for areas with Small Area FMRs)
 *
 * FMR represents the 40th percentile of gross rents in an area.
 * Used for market rent analysis and lot rent benchmarking.
 */
export const hudFairMarketRents = pgTable(
  'hud_fair_market_rents',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `hfr_${createId()}`),
    // Entity code from HUD (e.g., 'METRO10180M10180', 'COUNTY48001')
    entityCode: text('entity_code'),
    // ZIP code (only populated for Small Area FMR records)
    zipCode: text('zip_code'),
    countyName: text('county_name'),
    metroName: text('metro_name'),
    stateName: text('state_name'),
    stateCode: text('state_code'),
    fiscalYear: integer('fiscal_year').notNull(),
    // Rent values by bedroom count (monthly)
    efficiency: integer('efficiency'),
    oneBedroom: integer('one_bedroom'),
    twoBedroom: integer('two_bedroom'),
    threeBedroom: integer('three_bedroom'),
    fourBedroom: integer('four_bedroom'),
    // Small area designation ('1' if ZIP-level data available)
    smallAreaStatus: text('small_area_status'),
    // Metadata
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Entity-level records (metro/county without ZIP)
    uniqueIndex('hfr_entity_fiscal_year_idx').on(table.entityCode, table.fiscalYear),
    // ZIP-level records (Small Area FMRs)
    index('hfr_zip_fiscal_year_idx').on(table.zipCode, table.fiscalYear),
    index('hfr_county_name_idx').on(table.countyName),
    index('hfr_metro_name_idx').on(table.metroName),
    index('hfr_state_code_idx').on(table.stateCode),
  ]
);

/**
 * Census Demographics table
 *
 * Stores American Community Survey (ACS) 5-year estimates.
 * County-level demographic, income, and housing data for market analysis.
 */
export const censusDemographics = pgTable(
  'census_demographics',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `cen_${createId()}`),
    // Geography identifiers
    geoId: text('geo_id').notNull(), // FIPS code (e.g., "48029" for Bexar County, TX)
    geoType: text('geo_type').notNull(), // 'county', 'tract', 'zcta'
    geoName: text('geo_name').notNull(), // "Bexar County, Texas"
    stateCode: text('state_code'), // "48"
    countyCode: text('county_code'), // "029"
    // Survey metadata
    surveyYear: integer('survey_year').notNull(), // End year of 5-year estimate
    // Population metrics
    totalPopulation: integer('total_population'),
    populationGrowthRate: real('population_growth_rate'), // YoY % change
    medianAge: real('median_age'),
    // Income metrics
    medianHouseholdIncome: integer('median_household_income'),
    perCapitaIncome: integer('per_capita_income'),
    povertyRate: real('poverty_rate'), // % below poverty line
    // Housing metrics
    totalHousingUnits: integer('total_housing_units'),
    occupiedHousingUnits: integer('occupied_housing_units'),
    vacancyRate: real('vacancy_rate'), // % vacant
    ownerOccupiedRate: real('owner_occupied_rate'), // % owner-occupied
    renterOccupiedRate: real('renter_occupied_rate'), // % renter-occupied
    medianHomeValue: integer('median_home_value'),
    medianGrossRent: integer('median_gross_rent'),
    // Mobile home specific (ACS Table B25024 - Units in Structure)
    mobileHomesCount: integer('mobile_homes_count'),
    mobileHomesPercent: real('mobile_homes_percent'), // % of housing units
    // Education
    highSchoolGradRate: real('high_school_grad_rate'), // % with HS diploma+
    bachelorsDegreeRate: real('bachelors_degree_rate'), // % with bachelor's+
    // Metadata
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('cen_geo_survey_year_idx').on(table.geoId, table.surveyYear),
    index('cen_county_code_idx').on(table.countyCode),
    index('cen_geo_type_idx').on(table.geoType),
    index('cen_state_code_idx').on(table.stateCode),
  ]
);

/**
 * BLS Employment table
 *
 * Stores Bureau of Labor Statistics Local Area Unemployment Statistics (LAUS).
 * County-level employment data for economic health analysis.
 */
export const blsEmployment = pgTable(
  'bls_employment',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `bls_${createId()}`),
    // Area identifiers
    areaCode: text('area_code').notNull(), // LAUS area code (e.g., "CN4802900000000")
    areaName: text('area_name').notNull(), // "Bexar County, TX"
    areaType: text('area_type'), // 'county', 'msa', 'state'
    stateCode: text('state_code'), // "48"
    countyCode: text('county_code'), // "029"
    // Time period
    year: integer('year').notNull(),
    month: integer('month').notNull(), // 1-12
    periodType: text('period_type').notNull().default('monthly'), // 'monthly', 'annual'
    // Employment metrics (all in thousands for annual, raw for monthly)
    laborForce: integer('labor_force'), // Civilian labor force
    employed: integer('employed'), // Number employed
    unemployed: integer('unemployed'), // Number unemployed
    unemploymentRate: real('unemployment_rate'), // Unemployment rate %
    // Preliminary vs final data
    isPreliminary: text('is_preliminary').default('N'), // 'Y' or 'N'
    // Metadata
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('bls_area_year_month_idx').on(table.areaCode, table.year, table.month),
    index('bls_county_code_idx').on(table.countyCode),
    index('bls_state_code_idx').on(table.stateCode),
    index('bls_year_month_idx').on(table.year, table.month),
  ]
);

// Type exports
export type HudFairMarketRent = typeof hudFairMarketRents.$inferSelect;
export type NewHudFairMarketRent = typeof hudFairMarketRents.$inferInsert;
export type CensusDemographic = typeof censusDemographics.$inferSelect;
export type NewCensusDemographic = typeof censusDemographics.$inferInsert;
export type BlsEmployment = typeof blsEmployment.$inferSelect;
export type NewBlsEmployment = typeof blsEmployment.$inferInsert;
