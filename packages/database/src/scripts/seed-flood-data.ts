/**
 * Seed script for flood zone development/testing data
 *
 * Inserts synthetic flood zone polygons covering all risk levels
 * in the Bexar County / San Antonio area (default map view center).
 *
 * Usage:
 *   pnpm --filter @dealforge/database sync:flood:seed
 */

import { config } from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { neon } from '@neondatabase/serverless';

// Load environment
config({ path: '../../.env.local' });

interface SeedZone {
  zoneCode: string;
  zoneDescription: string;
  county: string;
  /** WKT POLYGON string */
  wkt: string;
}

/**
 * Generate a rectangular WKT polygon from center point and offset
 */
function makeRect(centerLng: number, centerLat: number, size = 0.005): string {
  const minLng = centerLng - size;
  const maxLng = centerLng + size;
  const minLat = centerLat - size;
  const maxLat = centerLat + size;
  return `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;
}

// San Antonio / Bexar County center area
const BASE_LNG = -98.49;
const BASE_LAT = 29.42;

const SEED_ZONES: SeedZone[] = [
  // High risk zones
  {
    zoneCode: 'A',
    zoneDescription: 'Special Flood Hazard Area - 1% annual chance flood',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG - 0.04, BASE_LAT + 0.02),
  },
  {
    zoneCode: 'AE',
    zoneDescription: 'Special Flood Hazard Area with base flood elevation',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG - 0.02, BASE_LAT + 0.02),
  },
  {
    zoneCode: 'AE FLOODWAY',
    zoneDescription: 'Special Flood Hazard Area with base flood elevation',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG, BASE_LAT + 0.02, 0.003),
  },
  {
    zoneCode: 'AH',
    zoneDescription: 'Special Flood Hazard Area - shallow flooding',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG + 0.02, BASE_LAT + 0.02),
  },
  {
    zoneCode: 'AO',
    zoneDescription: 'Special Flood Hazard Area - sheet flow',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG + 0.04, BASE_LAT + 0.02),
  },
  {
    zoneCode: 'AR',
    zoneDescription: 'Special Flood Hazard Area - levee restoration',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG - 0.04, BASE_LAT),
  },
  {
    zoneCode: 'A99',
    zoneDescription: 'Special Flood Hazard Area - flood control system under construction',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG - 0.02, BASE_LAT),
  },
  {
    zoneCode: 'V',
    zoneDescription: 'Coastal Special Flood Hazard Area',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG, BASE_LAT),
  },
  {
    zoneCode: 'VE',
    zoneDescription: 'Coastal Special Flood Hazard Area with base flood elevation',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG + 0.02, BASE_LAT),
  },
  // Moderate risk zones
  {
    zoneCode: 'B',
    zoneDescription: 'Moderate flood hazard area - 0.2% annual chance',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG + 0.04, BASE_LAT),
  },
  {
    zoneCode: 'X SHADED',
    zoneDescription: 'Moderate flood hazard area - 0.2% annual chance',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG - 0.04, BASE_LAT - 0.02),
  },
  // Low risk zones
  {
    zoneCode: 'X',
    zoneDescription: 'Minimal flood hazard area',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG - 0.02, BASE_LAT - 0.02, 0.008),
  },
  {
    zoneCode: 'X UNSHADED',
    zoneDescription: 'Minimal flood hazard area',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG + 0.02, BASE_LAT - 0.02),
  },
  {
    zoneCode: 'C',
    zoneDescription: 'Minimal flood hazard area',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG + 0.04, BASE_LAT - 0.02),
  },
  // Undetermined
  {
    zoneCode: 'D',
    zoneDescription: 'Undetermined flood hazard',
    county: 'Bexar',
    wkt: makeRect(BASE_LNG, BASE_LAT - 0.04, 0.01),
  },
];

async function seedFloodData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('Seeding flood zone data for development...');
  console.log(`Inserting ${SEED_ZONES.length} synthetic flood zones in Bexar County\n`);

  let insertedCount = 0;

  for (const zone of SEED_ZONES) {
    const id = `fz_seed_${createId()}`;

    try {
      await sql`
        INSERT INTO flood_zones (id, zone_code, zone_description, county, boundary, created_at)
        VALUES (
          ${id},
          ${zone.zoneCode},
          ${zone.zoneDescription},
          ${zone.county},
          ST_GeomFromText(${zone.wkt}, 4326)::geography,
          NOW()
        )
      `;
      insertedCount++;
      console.log(`  Inserted: ${zone.zoneCode} (${zone.county})`);
    } catch (error) {
      console.error(`  Error inserting ${zone.zoneCode}:`, error);
    }
  }

  console.log(`\nSeed complete: ${insertedCount}/${SEED_ZONES.length} zones inserted`);

  // Show totals
  const result = await sql`SELECT COUNT(*) as count FROM flood_zones`;
  console.log(`Total flood zones in database: ${result[0]?.count || 0}`);
}

seedFloodData().catch(console.error);
