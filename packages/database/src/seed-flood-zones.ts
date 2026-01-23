/**
 * Flood Zone Seed Script
 *
 * Creates sample FEMA flood zone data for development and testing.
 * Generates realistic flood zone polygons in MVP counties.
 *
 * Usage: pnpm db:seed:flood-zones
 */

import { config } from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { neon } from '@neondatabase/serverless';

// Load environment
config({ path: '../../.env.local' });

// Check for --force flag
const forceReseed = process.argv.includes('--force');

// FEMA flood zone descriptions
const ZONE_DESCRIPTIONS: Record<string, string> = {
  A: 'Special Flood Hazard Area - 1% annual chance flood (no BFE determined)',
  AE: 'Special Flood Hazard Area - 1% annual chance flood (BFE determined)',
  AH: 'Special Flood Hazard Area - shallow flooding (1-3 feet)',
  AO: 'Special Flood Hazard Area - sheet flow flooding',
  V: 'Coastal Special Flood Hazard Area - high velocity wave action',
  VE: 'Coastal Special Flood Hazard Area - with base flood elevation',
  X: 'Minimal flood hazard area',
  'X SHADED': 'Moderate flood hazard area - 0.2% annual chance',
  B: 'Moderate flood hazard area - 0.2% annual chance',
  C: 'Minimal flood hazard area',
  D: 'Undetermined flood hazard',
};

interface FloodZoneSample {
  zoneCode: string;
  county: string;
  // Center point for the polygon
  centerLat: number;
  centerLng: number;
  // Size of the polygon (degrees)
  sizeLat: number;
  sizeLng: number;
}

// Sample flood zones across MVP counties
// Creating realistic zones near rivers, coastal areas, and low-lying regions
const SAMPLE_FLOOD_ZONES: FloodZoneSample[] = [
  // Bexar County (San Antonio) - along San Antonio River
  { zoneCode: 'AE', county: 'Bexar', centerLat: 29.445, centerLng: -98.505, sizeLat: 0.02, sizeLng: 0.03 },
  { zoneCode: 'A', county: 'Bexar', centerLat: 29.395, centerLng: -98.48, sizeLat: 0.015, sizeLng: 0.025 },
  { zoneCode: 'AE', county: 'Bexar', centerLat: 29.52, centerLng: -98.45, sizeLat: 0.018, sizeLng: 0.028 },
  { zoneCode: 'X', county: 'Bexar', centerLat: 29.48, centerLng: -98.55, sizeLat: 0.08, sizeLng: 0.1 },
  { zoneCode: 'X SHADED', county: 'Bexar', centerLat: 29.42, centerLng: -98.42, sizeLat: 0.025, sizeLng: 0.035 },

  // Travis County (Austin) - along Colorado River
  { zoneCode: 'AE', county: 'Travis', centerLat: 30.265, centerLng: -97.745, sizeLat: 0.02, sizeLng: 0.04 },
  { zoneCode: 'A', county: 'Travis', centerLat: 30.22, centerLng: -97.78, sizeLat: 0.015, sizeLng: 0.02 },
  { zoneCode: 'AO', county: 'Travis', centerLat: 30.31, centerLng: -97.7, sizeLat: 0.01, sizeLng: 0.015 },
  { zoneCode: 'X', county: 'Travis', centerLat: 30.28, centerLng: -97.82, sizeLat: 0.1, sizeLng: 0.12 },
  { zoneCode: 'X SHADED', county: 'Travis', centerLat: 30.24, centerLng: -97.68, sizeLat: 0.02, sizeLng: 0.03 },

  // Hidalgo County (McAllen/Rio Grande Valley)
  { zoneCode: 'AE', county: 'Hidalgo', centerLat: 26.22, centerLng: -98.24, sizeLat: 0.025, sizeLng: 0.04 },
  { zoneCode: 'A', county: 'Hidalgo', centerLat: 26.18, centerLng: -98.18, sizeLat: 0.02, sizeLng: 0.03 },
  { zoneCode: 'AH', county: 'Hidalgo', centerLat: 26.25, centerLng: -98.3, sizeLat: 0.015, sizeLng: 0.02 },
  { zoneCode: 'X', county: 'Hidalgo', centerLat: 26.3, centerLng: -98.15, sizeLat: 0.08, sizeLng: 0.1 },

  // Cameron County (Brownsville/South Padre) - coastal zones
  { zoneCode: 'VE', county: 'Cameron', centerLat: 26.07, centerLng: -97.17, sizeLat: 0.02, sizeLng: 0.01 },
  { zoneCode: 'AE', county: 'Cameron', centerLat: 26.0, centerLng: -97.4, sizeLat: 0.03, sizeLng: 0.04 },
  { zoneCode: 'V', county: 'Cameron', centerLat: 26.12, centerLng: -97.165, sizeLat: 0.015, sizeLng: 0.008 },
  { zoneCode: 'X', county: 'Cameron', centerLat: 25.95, centerLng: -97.5, sizeLat: 0.06, sizeLng: 0.08 },

  // Nueces County (Corpus Christi) - coastal zones
  { zoneCode: 'VE', county: 'Nueces', centerLat: 27.72, centerLng: -97.28, sizeLat: 0.015, sizeLng: 0.01 },
  { zoneCode: 'AE', county: 'Nueces', centerLat: 27.78, centerLng: -97.4, sizeLat: 0.025, sizeLng: 0.035 },
  { zoneCode: 'AO', county: 'Nueces', centerLat: 27.68, centerLng: -97.35, sizeLat: 0.012, sizeLng: 0.018 },
  { zoneCode: 'X', county: 'Nueces', centerLat: 27.82, centerLng: -97.5, sizeLat: 0.07, sizeLng: 0.09 },
  { zoneCode: 'X SHADED', county: 'Nueces', centerLat: 27.75, centerLng: -97.32, sizeLat: 0.02, sizeLng: 0.025 },
];

/**
 * Generate a simple rectangular polygon GeoJSON
 */
function generatePolygon(
  centerLat: number,
  centerLng: number,
  sizeLat: number,
  sizeLng: number
): string {
  const minLat = centerLat - sizeLat / 2;
  const maxLat = centerLat + sizeLat / 2;
  const minLng = centerLng - sizeLng / 2;
  const maxLng = centerLng + sizeLng / 2;

  // Add some irregularity to make it look more natural
  const jitter = () => (Math.random() - 0.5) * 0.005;

  const coordinates = [
    [
      [minLng + jitter(), minLat + jitter()],
      [maxLng + jitter(), minLat + jitter()],
      [maxLng + jitter(), maxLat + jitter()],
      [minLng + jitter(), maxLat + jitter()],
      [minLng + jitter(), minLat + jitter()], // Close the ring
    ],
  ];

  return JSON.stringify({
    type: 'MultiPolygon',
    coordinates: [coordinates],
  });
}

async function seedFloodZones() {
  console.log('🌊 Starting flood zone seed...\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  // Check existing count
  const countResult = await sql`SELECT COUNT(*) as count FROM flood_zones`;
  const existingCount = Number(countResult[0]?.count ?? 0);

  if (existingCount > 0) {
    if (forceReseed) {
      console.log(`🗑️  Deleting ${existingCount} existing flood zones (--force flag)...`);
      await sql`DELETE FROM flood_zones`;
      console.log('  ✓ Deleted existing flood zones\n');
    } else {
      console.log(`⚠️  ${existingCount} flood zones already exist. Skipping seed to avoid duplicates.`);
      console.log('   Use --force flag to delete and re-seed.\n');
      process.exit(0);
    }
  }

  console.log('Creating sample flood zones...\n');

  let insertedCount = 0;
  const zoneCounts: Record<string, number> = {};

  for (const zone of SAMPLE_FLOOD_ZONES) {
    const id = `fz_${createId()}`;
    const description = ZONE_DESCRIPTIONS[zone.zoneCode] ?? `Flood zone ${zone.zoneCode}`;
    const boundaryGeoJson = generatePolygon(
      zone.centerLat,
      zone.centerLng,
      zone.sizeLat,
      zone.sizeLng
    );

    try {
      await sql`
        INSERT INTO flood_zones (id, zone_code, zone_description, county, boundary, created_at)
        VALUES (
          ${id},
          ${zone.zoneCode},
          ${description},
          ${zone.county},
          ST_GeomFromGeoJSON(${boundaryGeoJson})::geography,
          NOW()
        )
      `;
      insertedCount++;

      // Track counts by zone code
      zoneCounts[zone.zoneCode] = (zoneCounts[zone.zoneCode] ?? 0) + 1;

      console.log(`  ✓ Created ${zone.zoneCode} zone in ${zone.county} County`);
    } catch (error) {
      console.error(`  ❌ Failed to create zone in ${zone.county}:`, error);
    }
  }

  console.log(`\n✅ Seed completed successfully!\n`);
  console.log(`Created ${insertedCount} flood zones:\n`);

  // Show distribution by zone type
  console.log('Zone distribution:');
  const highRiskZones = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'];
  for (const [zone, count] of Object.entries(zoneCounts).sort()) {
    const risk = highRiskZones.includes(zone) ? '🔴 high' : zone.includes('SHADED') || zone === 'B' ? '🟡 moderate' : '🟢 low';
    console.log(`  ${zone}: ${count} (${risk} risk)`);
  }

  // Show distribution by county
  console.log('\nCounty distribution:');
  const countyCounts: Record<string, number> = {};
  for (const zone of SAMPLE_FLOOD_ZONES) {
    countyCounts[zone.county] = (countyCounts[zone.county] ?? 0) + 1;
  }
  for (const [county, count] of Object.entries(countyCounts).sort()) {
    console.log(`  ${county}: ${count} zones`);
  }

  console.log('\n');
  process.exit(0);
}

seedFloodZones().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
