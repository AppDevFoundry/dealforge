import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * CCN (Certificate of Convenience and Necessity) Areas table
 *
 * Stores water/sewer utility service area boundaries for Texas.
 * The boundary column uses PostGIS GEOGRAPHY type for spatial queries.
 *
 * Note: The `boundary` column is defined as TEXT here because Drizzle doesn't
 * natively support PostGIS types. The actual column is created via raw SQL
 * migration as GEOGRAPHY(POLYGON, 4326).
 */
export const ccnAreas = pgTable(
  'ccn_areas',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `ccn_${createId()}`),
    ccnNumber: text('ccn_number'),
    utilityName: text('utility_name').notNull(),
    serviceType: text('service_type').notNull(), // 'water', 'sewer', 'both'
    county: text('county'),
    // Note: boundary is GEOGRAPHY(POLYGON, 4326) in the actual table
    // We use text here as a placeholder - actual spatial queries use raw SQL
    boundary: text('boundary'),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ccn_areas_county_idx').on(table.county),
    index('ccn_areas_service_type_idx').on(table.serviceType),
    index('ccn_areas_utility_name_idx').on(table.utilityName),
  ]
);

/**
 * Flood Zones table
 *
 * Stores FEMA National Flood Hazard Layer (NFHL) flood zone boundaries.
 * The boundary column uses PostGIS GEOGRAPHY type for spatial queries.
 *
 * Zone codes:
 * - High risk (A, AE, AH, AO, AR, A99, V, VE): Special Flood Hazard Areas
 * - Moderate risk (B, X shaded): 0.2% annual chance flood
 * - Low risk (C, X unshaded): Minimal flood hazard
 */
export const floodZones = pgTable(
  'flood_zones',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `fz_${createId()}`),
    zoneCode: text('zone_code').notNull(),
    zoneDescription: text('zone_description'),
    county: text('county'),
    // Note: boundary is GEOGRAPHY(MULTIPOLYGON, 4326) in the actual table
    boundary: text('boundary'),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('flood_zones_county_idx').on(table.county),
    index('flood_zones_zone_code_idx').on(table.zoneCode),
  ]
);

/**
 * CCN Facilities table
 *
 * Stores water/sewer utility facility lines (pipes, infrastructure).
 * Unlike service areas (polygons), these are LineString geometries showing
 * where actual infrastructure runs.
 *
 * Note: The `geometry` column is GEOGRAPHY(GEOMETRY, 4326) to support both
 * LineString and MultiLineString types.
 */
export const ccnFacilities = pgTable(
  'ccn_facilities',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `ccnf_${createId()}`),
    ccnNumber: text('ccn_number'),
    utilityName: text('utility_name').notNull(),
    serviceType: text('service_type').notNull(), // 'water', 'sewer', 'both'
    county: text('county'),
    // Note: geometry is GEOGRAPHY(GEOMETRY, 4326) in the actual table
    // Supports LineString and MultiLineString
    geometry: text('geometry'),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ccn_facilities_county_idx').on(table.county),
    index('ccn_facilities_service_type_idx').on(table.serviceType),
    index('ccn_facilities_utility_name_idx').on(table.utilityName),
  ]
);

// Type exports
export type CcnArea = typeof ccnAreas.$inferSelect;
export type NewCcnArea = typeof ccnAreas.$inferInsert;
export type CcnFacility = typeof ccnFacilities.$inferSelect;
export type NewCcnFacility = typeof ccnFacilities.$inferInsert;
export type FloodZone = typeof floodZones.$inferSelect;
export type NewFloodZone = typeof floodZones.$inferInsert;
