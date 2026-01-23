/**
 * Sync FEMA Flood Zone data
 *
 * Parses FEMA NFHL (National Flood Hazard Layer) shapefiles and
 * loads them into the flood_zones table.
 *
 * Usage:
 *   pnpm sync:flood --file <path-to-shapefile> [--county <county-name>]
 *
 * The shapefile should be the S_FLD_HAZ_AR layer with attributes:
 * - FLD_ZONE: Flood zone designation (A, AE, X, etc.)
 * - ZONE_SUBTY: Zone subtype description
 */

import { parseArgs } from 'node:util';
import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';
import { open } from 'shapefile';
import 'dotenv/config';

const ZONE_DESCRIPTIONS: Record<string, string> = {
  A: '1% annual chance flood (no BFE determined)',
  AE: '1% annual chance flood (BFE determined)',
  AH: '1% annual chance shallow flooding (ponding)',
  AO: '1% annual chance shallow flooding (sheet flow)',
  AR: 'Temporary increased risk due to levee restoration',
  A99: '1% annual chance flood (to be protected by federal flood protection system)',
  V: 'Coastal 1% annual chance flood with wave action (no BFE)',
  VE: 'Coastal 1% annual chance flood with wave action (BFE determined)',
  X: 'Minimal flood hazard area',
  D: 'Undetermined flood hazard',
};

const { values } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    county: { type: 'string', short: 'c' },
  },
});

if (!values.file) {
  console.error('Usage: pnpm sync:flood --file <path-to-shapefile> [--county <county-name>]');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  const sql = neon(connectionString!);
  const county = values.county || 'Unknown';

  console.log(`Reading shapefile: ${values.file}`);
  console.log(`County: ${county}`);

  const source = await open(values.file!);

  let count = 0;
  let skipped = 0;
  let batch: string[] = [];
  const BATCH_SIZE = 50;

  async function flushBatch() {
    if (batch.length === 0) return;
    await sql(batch.join(';'));
    batch = [];
  }

  while (true) {
    const result = await source.read();
    if (result.done) break;

    const { properties, geometry } = result.value;
    if (!geometry || !properties) {
      skipped++;
      continue;
    }

    const zoneCode = (properties.FLD_ZONE || properties.fld_zone || '').toString().trim();
    if (!zoneCode) {
      skipped++;
      continue;
    }

    const id = `fz_${createId()}`;
    const zoneDescription = ZONE_DESCRIPTIONS[zoneCode] || properties.ZONE_SUBTY || null;
    const geojson = JSON.stringify(geometry);

    const descValue = zoneDescription ? `'${zoneDescription.replace(/'/g, "''")}'` : 'NULL';

    batch.push(
      `INSERT INTO flood_zones (id, zone_code, zone_description, county, boundary)
       VALUES ('${id}', '${zoneCode}', ${descValue}, '${county.replace(/'/g, "''")}', ST_GeomFromGeoJSON('${geojson}')::geography)
       ON CONFLICT (id) DO NOTHING`
    );

    count++;

    if (batch.length >= BATCH_SIZE) {
      await flushBatch();
      if (count % 500 === 0) {
        console.log(`  Processed ${count} features...`);
      }
    }
  }

  await flushBatch();
  console.log(`Synced ${count} flood zones (${skipped} skipped).`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
