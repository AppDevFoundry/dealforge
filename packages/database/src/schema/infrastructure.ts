import { createId } from '@paralleldrive/cuid2';
import { customType, index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Custom geography type for PostGIS columns.
 * Drizzle ORM doesn't have native PostGIS support, so we use customType.
 */
const geography = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geography';
  },
  toDriver(value: string): string {
    return value;
  },
  fromDriver(value: string): string {
    return value;
  },
});

/**
 * CCN (Certificate of Convenience and Necessity) Service Areas
 *
 * Water and sewer utility service area boundaries from
 * the Texas Public Utility Commission.
 */
export const ccnAreas = pgTable(
  'ccn_areas',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `ccn_${createId()}`),
    ccnNumber: text('ccn_number').notNull(),
    utilityName: text('utility_name').notNull(),
    serviceType: text('service_type').notNull(), // 'water', 'sewer', 'both'
    county: text('county').notNull(),
    boundary: geography('boundary').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('ccn_areas_county_idx').on(table.county),
    index('ccn_areas_service_type_idx').on(table.serviceType),
    index('ccn_areas_ccn_number_idx').on(table.ccnNumber),
  ]
);

/**
 * FEMA Flood Zone polygons
 *
 * National Flood Hazard Layer (NFHL) data for Texas.
 */
export const floodZones = pgTable(
  'flood_zones',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `fz_${createId()}`),
    zoneCode: text('zone_code').notNull(), // 'A', 'AE', 'AH', 'X', etc.
    zoneDescription: text('zone_description'),
    county: text('county').notNull(),
    boundary: geography('boundary').notNull(),
    effectiveDate: timestamp('effective_date', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('flood_zones_county_idx').on(table.county),
    index('flood_zones_zone_code_idx').on(table.zoneCode),
  ]
);

// Type exports
export type CcnArea = typeof ccnAreas.$inferSelect;
export type NewCcnArea = typeof ccnAreas.$inferInsert;
export type FloodZone = typeof floodZones.$inferSelect;
export type NewFloodZone = typeof floodZones.$inferInsert;
