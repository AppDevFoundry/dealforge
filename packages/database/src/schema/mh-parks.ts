import { pgTable, text, timestamp, real, integer, numeric, index, unique, date } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * MH Communities table
 *
 * Stores manufactured housing community/park data.
 */
export const mhCommunities = pgTable(
  'mh_communities',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `mhc_${createId()}`),
    name: text('name').notNull(),
    address: text('address'),
    city: text('city'),
    county: text('county').notNull(),
    state: text('state').notNull().default('TX'),
    zip: text('zip'),

    // Location
    latitude: real('latitude'),
    longitude: real('longitude'),

    // Park details
    lotCount: integer('lot_count'),
    estimatedOccupancy: numeric('estimated_occupancy', { precision: 5, scale: 2 }),
    propertyType: text('property_type').notNull().default('unknown'),

    // Ownership
    ownerName: text('owner_name'),
    ownerAddress: text('owner_address'),
    cadPropertyId: text('cad_property_id'),

    // Source tracking
    source: text('source').notNull().default('manual'),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('mh_communities_county_idx').on(table.county),
    index('mh_communities_city_idx').on(table.city),
    index('mh_communities_property_type_idx').on(table.propertyType),
    index('mh_communities_lat_lng_idx').on(table.latitude, table.longitude),
  ]
);

/**
 * MH Titlings table
 *
 * Stores monthly titling activity data from TDHCA.
 */
export const mhTitlings = pgTable(
  'mh_titlings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `mht_${createId()}`),
    county: text('county').notNull(),
    month: date('month').notNull(),

    // Activity metrics
    newTitles: integer('new_titles'),
    transfers: integer('transfers'),
    totalActive: integer('total_active'),

    // Source
    sourceReport: text('source_report'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('mh_titlings_county_month_unq').on(table.county, table.month),
    index('mh_titlings_month_idx').on(table.month),
  ]
);

// Type exports
export type MhCommunityRow = typeof mhCommunities.$inferSelect;
export type NewMhCommunity = typeof mhCommunities.$inferInsert;
export type MhTitlingRow = typeof mhTitlings.$inferSelect;
export type NewMhTitling = typeof mhTitlings.$inferInsert;
