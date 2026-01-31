import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './users';
import { parcels } from './parcels';

/**
 * Parcel data snapshot stored with lead intelligence
 */
export interface ParcelDataSnapshot {
  id: string;
  propId: string;
  geoId: string | null;
  county: string;
  fips: string | null;
  ownerName: string | null;
  ownerCareOf: string | null;
  situsAddress: string | null;
  situsCity: string | null;
  situsState: string | null;
  situsZip: string | null;
  mailAddress: string | null;
  mailCity: string | null;
  mailState: string | null;
  mailZip: string | null;
  legalDescription: string | null;
  legalArea: number | null;
  legalAreaUnit: string | null;
  landValue: number | null;
  improvementValue: number | null;
  marketValue: number | null;
  taxYear: string | null;
  stateLandUse: string | null;
  localLandUse: string | null;
  yearBuilt: string | null;
  gisArea: number | null;
  sourceUpdatedAt: string | null;
  fetchedAt: string;
}

/**
 * Lead status enum
 */
export const leadStatusEnum = pgEnum('lead_status', [
  'new',
  'analyzing',
  'analyzed',
  'interested',
  'passed',
  'in_progress',
  'closed',
  'dead',
]);

/**
 * Property type enum
 */
export const propertyTypeEnum = pgEnum('property_type', [
  'singlewide',
  'doublewide',
  'land_only',
  'land_with_home',
  'park',
  'other',
]);

/**
 * Property condition enum
 */
export const propertyConditionEnum = pgEnum('property_condition', [
  'excellent',
  'good',
  'average',
  'fair',
  'poor',
  'needs_rehab',
  'unknown',
]);

/**
 * Leads table
 *
 * Stores property leads submitted by users for analysis.
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
    orgId: text('org_id'), // For future organization support

    // Status
    status: leadStatusEnum('status').notNull().default('new'),

    // Address
    address: text('address').notNull(),
    city: text('city'),
    county: text('county'),
    state: text('state').default('TX'),
    zipCode: text('zip_code'),
    latitude: real('latitude'),
    longitude: real('longitude'),

    // Property details
    propertyType: propertyTypeEnum('property_type'),
    propertyCondition: propertyConditionEnum('property_condition'),
    yearBuilt: integer('year_built'),
    lotSize: real('lot_size'), // acres
    homeSize: real('home_size'), // sq ft
    bedrooms: integer('bedrooms'),
    bathrooms: real('bathrooms'),
    lotCount: integer('lot_count'), // For parks

    // Financials
    askingPrice: integer('asking_price'),
    estimatedValue: integer('estimated_value'),
    lotRent: integer('lot_rent'), // Monthly lot rent for parks
    monthlyIncome: integer('monthly_income'),
    annualTaxes: integer('annual_taxes'),
    annualInsurance: integer('annual_insurance'),

    // Seller info
    sellerName: text('seller_name'),
    sellerPhone: text('seller_phone'),
    sellerEmail: text('seller_email'),
    sellerMotivation: text('seller_motivation'),
    leadSource: text('lead_source'), // 'direct_mail', 'referral', 'zillow', etc.

    // Notes
    notes: text('notes'),

    // Additional metadata
    metadata: jsonb('metadata'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    analyzedAt: timestamp('analyzed_at', { withTimezone: true }),
  },
  (table) => [
    index('leads_user_id_idx').on(table.userId),
    index('leads_status_idx').on(table.status),
    index('leads_county_idx').on(table.county),
    index('leads_zip_code_idx').on(table.zipCode),
    index('leads_created_at_idx').on(table.createdAt),
    index('leads_property_type_idx').on(table.propertyType),
  ]
);

/**
 * Lead Intelligence table
 *
 * Stores gathered intelligence data for a lead.
 * One-to-one relationship with leads table.
 */
export const leadIntelligence = pgTable(
  'lead_intelligence',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `lint_${createId()}`),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),

    // Parcel data (from TxGIO/TNRIS)
    parcelId: text('parcel_id').references(() => parcels.id, { onDelete: 'set null' }),
    parcelData: jsonb('parcel_data').$type<ParcelDataSnapshot>(), // Snapshot of parcel data at analysis time

    // CCN Coverage
    waterCcn: jsonb('water_ccn'), // { utilityName, ccnNumber, ... }
    sewerCcn: jsonb('sewer_ccn'),
    hasWaterCoverage: boolean('has_water_coverage'),
    hasSewerCoverage: boolean('has_sewer_coverage'),

    // Flood zone
    floodZone: text('flood_zone'),
    floodZoneDescription: text('flood_zone_description'),
    isHighRiskFlood: boolean('is_high_risk_flood'),

    // Fair Market Rent
    fmrData: jsonb('fmr_data'), // { efficiency, oneBr, twoBr, threeBr, fourBr, year }

    // Demographics (Census data)
    demographics: jsonb('demographics'), // { population, medianIncome, medianAge, ... }

    // TDHCA match
    tdhcaMatch: jsonb('tdhca_match'), // Matched TDHCA record if found

    // Nearby parks
    nearbyParks: jsonb('nearby_parks'), // Array of nearby MH communities

    // AI Analysis
    aiAnalysis: jsonb('ai_analysis'), // { insights, risks, opportunities, recommendation }
    aiAnalyzedAt: timestamp('ai_analyzed_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('lead_intelligence_lead_id_idx').on(table.leadId), unique().on(table.leadId)]
);

/**
 * Lead Reports table
 *
 * Stores generated PDF reports for leads.
 */
export const leadReports = pgTable(
  'lead_reports',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `lrpt_${createId()}`),
    leadId: text('lead_id')
      .notNull()
      .references(() => leads.id, { onDelete: 'cascade' }),

    // Report metadata
    version: integer('version').notNull().default(1),
    fileName: text('file_name').notNull(),

    // Snapshot of data at report generation time
    reportData: jsonb('report_data').notNull(),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('lead_reports_lead_id_idx').on(table.leadId)]
);

// Type exports
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type LeadIntelligence = typeof leadIntelligence.$inferSelect;
export type NewLeadIntelligence = typeof leadIntelligence.$inferInsert;
export type LeadReport = typeof leadReports.$inferSelect;
export type NewLeadReport = typeof leadReports.$inferInsert;
