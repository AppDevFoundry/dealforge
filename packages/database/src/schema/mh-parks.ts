import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * MH Communities/Parks table
 *
 * Stores mobile home community information for Texas.
 */
export const mhCommunities = pgTable(
  'mh_communities',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `mhc_${createId()}`),
    name: text('name').notNull(),
    address: text('address'),
    city: text('city').notNull(),
    county: text('county').notNull(),
    state: text('state').notNull().default('TX'),
    zipCode: text('zip_code'),
    latitude: real('latitude'),
    longitude: real('longitude'),
    lotCount: integer('lot_count'),
    estimatedOccupancy: real('estimated_occupancy'),
    propertyType: text('property_type'), // 'all_ages', 'senior_55+', 'family'
    ownerName: text('owner_name'),
    source: text('source').notNull(), // 'tdhca', 'manual', 'cad'
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('mh_communities_county_idx').on(table.county),
    index('mh_communities_city_idx').on(table.city),
    index('mh_communities_lot_count_idx').on(table.lotCount),
  ]
);

/**
 * Monthly Titling Activity table
 *
 * Stores monthly mobile home titling statistics by county.
 */
export const mhTitlings = pgTable(
  'mh_titlings',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `mht_${createId()}`),
    county: text('county').notNull(),
    month: timestamp('month', { withTimezone: true }).notNull(),
    newTitles: integer('new_titles').notNull().default(0),
    transfers: integer('transfers').notNull().default(0),
    totalActive: integer('total_active'),
    source: text('source').notNull().default('tdhca'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('mh_titlings_county_idx').on(table.county),
    index('mh_titlings_month_idx').on(table.month),
  ]
);

/**
 * Texas Counties table
 *
 * Reference data for Texas counties.
 */
export const texasCounties = pgTable('texas_counties', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => `txc_${createId()}`),
  name: text('name').notNull().unique(),
  fipsCode: text('fips_code').notNull().unique(),
  region: text('region'),
  centerLat: real('center_lat'),
  centerLng: real('center_lng'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * MH Tax Liens table
 *
 * Stores tax lien records for manufactured homes from TDHCA.
 * This surfaces distressed MH properties in Texas.
 */
export const mhTaxLiens = pgTable(
  'mh_tax_liens',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `mtl_${createId()}`),
    serialNumber: text('serial_number'),
    hudLabel: text('hud_label'),
    county: text('county').notNull(),
    taxingEntity: text('taxing_entity'),
    amount: real('amount'),
    year: integer('year'),
    status: text('status').notNull(), // 'active', 'released'
    filedDate: timestamp('filed_date', { withTimezone: true }),
    releasedDate: timestamp('released_date', { withTimezone: true }),
    // Link to community (optional, matched by address)
    communityId: text('community_id').references(() => mhCommunities.id),
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('mh_tax_liens_county_idx').on(table.county),
    index('mh_tax_liens_status_idx').on(table.status),
    index('mh_tax_liens_serial_number_idx').on(table.serialNumber),
    index('mh_tax_liens_community_id_idx').on(table.communityId),
  ]
);

// Type exports
export type MhCommunity = typeof mhCommunities.$inferSelect;
export type NewMhCommunity = typeof mhCommunities.$inferInsert;
export type MhTitling = typeof mhTitlings.$inferSelect;
export type NewMhTitling = typeof mhTitlings.$inferInsert;
export type TexasCounty = typeof texasCounties.$inferSelect;
export type NewTexasCounty = typeof texasCounties.$inferInsert;
export type MhTaxLien = typeof mhTaxLiens.$inferSelect;
export type NewMhTaxLien = typeof mhTaxLiens.$inferInsert;
