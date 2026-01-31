import {
  doublePrecision,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

/**
 * Parcels table
 *
 * Cached parcel data from TxGIO/TNRIS StratMap Land Parcels dataset.
 * Data is fetched on-demand via the TxGIO ArcGIS REST API and cached locally.
 *
 * Note: The `boundary` column is defined as TEXT here because Drizzle doesn't
 * natively support PostGIS types. The actual column is created via raw SQL
 * migration as GEOGRAPHY(POLYGON, 4326).
 *
 * @see https://tnris.org/stratmap/land-parcels.html
 */
export const parcels = pgTable(
  'parcels',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => `prcl_${createId()}`),

    // TxGIO identifiers
    propId: text('prop_id').notNull(),
    geoId: text('geo_id'),
    county: text('county').notNull(),
    fips: text('fips'),

    // Owner info
    ownerName: text('owner_name'),
    ownerCareOf: text('owner_care_of'),

    // Property address (situs)
    situsAddress: text('situs_address'),
    situsCity: text('situs_city'),
    situsState: text('situs_state').default('TX'),
    situsZip: text('situs_zip'),

    // Mailing address
    mailAddress: text('mail_address'),
    mailCity: text('mail_city'),
    mailState: text('mail_state'),
    mailZip: text('mail_zip'),

    // Legal description
    legalDescription: text('legal_description'),
    legalArea: doublePrecision('legal_area'), // acres from source
    legalAreaUnit: text('legal_area_unit'),

    // Assessed values
    landValue: doublePrecision('land_value'),
    improvementValue: doublePrecision('improvement_value'),
    marketValue: doublePrecision('market_value'),
    taxYear: text('tax_year'),

    // Land use codes
    stateLandUse: text('state_land_use'),
    localLandUse: text('local_land_use'),

    // Geometry (PostGIS)
    // Note: boundary is GEOGRAPHY(POLYGON, 4326) in the actual table
    // We use text here as a placeholder - actual spatial queries use raw SQL
    boundary: text('boundary'),
    gisArea: doublePrecision('gis_area'), // calculated from geometry in sq meters

    // Metadata
    sourceUpdatedAt: timestamp('source_updated_at', { withTimezone: true }),
    fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Unique constraint on prop_id + county (same property can exist in different counties)
    unique('parcels_prop_id_county_unique').on(table.propId, table.county),

    // Lookup indexes
    index('parcels_county_idx').on(table.county),
    index('parcels_situs_zip_idx').on(table.situsZip),
    index('parcels_owner_name_idx').on(table.ownerName),
    index('parcels_prop_id_idx').on(table.propId),

    // Note: GIST spatial index on boundary is created in the migration file
  ]
);

// Type exports
export type Parcel = typeof parcels.$inferSelect;
export type NewParcel = typeof parcels.$inferInsert;
