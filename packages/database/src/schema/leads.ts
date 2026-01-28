import { createId } from '@paralleldrive/cuid2';
import { index, integer, jsonb, pgEnum, pgTable, real, text, timestamp } from 'drizzle-orm/pg-core';

import { users } from './users';

export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'analyzing',
  'analyzed',
  'contacted',
  'archived',
]);

export const propertyTypeEnum = pgEnum('property_type', [
  'manufactured_home',
  'mobile_home',
  'land_only',
  'improved_lot',
  'tiny_house',
]);

export const conditionEnum = pgEnum('condition', [
  'excellent',
  'good',
  'fair',
  'poor',
  'needs_work',
]);

/**
 * Leads table
 *
 * Tracks property leads for acquisition analysis.
 */
export const leads = pgTable(
  'leads',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `lead_${createId()}`),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: leadStatusEnum('status').notNull().default('new'),

    // Address
    addressRaw: text('address_raw').notNull(),
    addressNormalized: text('address_normalized'),
    city: text('city'),
    state: text('state'),
    zipCode: text('zip_code'),
    county: text('county'),
    latitude: real('latitude'),
    longitude: real('longitude'),

    // Property details
    propertyType: propertyTypeEnum('property_type'),
    yearBuilt: integer('year_built'),
    beds: integer('beds'),
    baths: integer('baths'),
    sqft: integer('sqft'),
    acreage: real('acreage'),
    condition: conditionEnum('condition'),
    conditionNotes: text('condition_notes'),

    // Financial
    askingPrice: real('asking_price'),
    mortgageBalance: real('mortgage_balance'),
    taxesOwed: real('taxes_owed'),
    estimatedRepairs: real('estimated_repairs'),

    // Seller info
    sellerName: text('seller_name'),
    sellerPhone: text('seller_phone'),
    sellerEmail: text('seller_email'),
    sellerMotivation: text('seller_motivation'),
    sellerTimeframe: text('seller_timeframe'),
    leadSource: text('lead_source'),

    // Flexible features
    features: jsonb('features').default([]),
    notes: text('notes'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  },
  (table) => [
    index('leads_user_id_idx').on(table.userId),
    index('leads_status_idx').on(table.status),
    index('leads_created_at_idx').on(table.createdAt),
    index('leads_zip_code_idx').on(table.zipCode),
  ]
);

/**
 * Lead Intelligence table
 *
 * Stores gathered intelligence data for a lead after analysis.
 */
export const leadIntelligence = pgTable(
  'lead_intelligence',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `lint_${createId()}`),
    leadId: text('lead_id')
      .notNull()
      .unique()
      .references(() => leads.id, { onDelete: 'cascade' }),

    // CCN utility coverage
    hasWaterCcn: jsonb('has_water_ccn').default(false),
    waterProvider: text('water_provider'),
    hasSewerCcn: jsonb('has_sewer_ccn').default(false),
    sewerProvider: text('sewer_provider'),

    // Flood zone (placeholder for FEMA)
    floodZone: text('flood_zone'),

    // Market data
    fmrFiscalYear: integer('fmr_fiscal_year'),
    fmrTwoBedroom: real('fmr_two_bedroom'),
    suggestedLotRentLow: real('suggested_lot_rent_low'),
    suggestedLotRentHigh: real('suggested_lot_rent_high'),

    // Demographics
    medianHouseholdIncome: real('median_household_income'),
    unemploymentRate: real('unemployment_rate'),
    populationGrowthRate: real('population_growth_rate'),
    mobileHomesPercent: real('mobile_homes_percent'),

    // Nearby parks
    nearbyParksCount: integer('nearby_parks_count').default(0),
    nearbyParksData: jsonb('nearby_parks_data').default([]),

    // TDHCA records
    recordId: text('record_id'),
    ownerName: text('owner_name'),
    manufacturer: text('manufacturer'),
    modelYear: integer('model_year'),
    hasLiens: jsonb('has_liens').default(false),
    totalLienAmount: real('total_lien_amount'),

    // AI analysis
    aiInsights: jsonb('ai_insights').default([]),
    aiRiskFactors: jsonb('ai_risk_factors').default([]),
    aiOpportunities: jsonb('ai_opportunities').default([]),
    aiRecommendation: text('ai_recommendation'),
    aiConfidenceScore: real('ai_confidence_score'),

    // Raw audit trail
    rawResponses: jsonb('raw_responses').default({}),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('lead_intelligence_lead_id_idx').on(table.leadId),
    index('lead_intelligence_created_at_idx').on(table.createdAt),
  ]
);

/**
 * Lead Reports table
 *
 * Tracks generated PDF reports for leads.
 */
export const leadReports = pgTable(
  'lead_reports',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `rpt_${createId()}`),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),
    reportType: text('report_type').notNull().default('due_diligence'),
    version: integer('version').notNull().default(1),
    fileName: text('file_name'),
    fileSizeBytes: integer('file_size_bytes'),
    generatedBy: text('generated_by').notNull().default('system'),
    fileUrl: text('file_url'),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('lead_reports_lead_id_idx').on(table.leadId),
    index('lead_reports_created_at_idx').on(table.createdAt),
  ]
);

// Type exports
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadIntelligence = typeof leadIntelligence.$inferSelect;
export type NewLeadIntelligence = typeof leadIntelligence.$inferInsert;
export type LeadReport = typeof leadReports.$inferSelect;
export type NewLeadReport = typeof leadReports.$inferInsert;
export type LeadStatus = (typeof leadStatusEnum.enumValues)[number];
export type PropertyType = (typeof propertyTypeEnum.enumValues)[number];
export type Condition = (typeof conditionEnum.enumValues)[number];
