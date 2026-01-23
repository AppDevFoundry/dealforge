/**
 * Sync CCN (Certificate of Convenience and Necessity) data
 *
 * Parses PUC Texas CCN shapefiles and loads them into the ccn_areas table.
 *
 * Usage:
 *   pnpm sync:ccn --file <path-to-shapefile>
 *
 * The shapefile should contain CCN boundary polygons with attributes:
 * - CCN_NO: CCN certificate number
 * - UTILITY_NA: Utility name
 * - SERVICE_TY: Service type ('W' = water, 'S' = sewer, 'B' = both)
 * - COUNTY: County name
 */

import { parseArgs } from 'node:util';
import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';
import { open } from 'shapefile';
import 'dotenv/config';

const { values } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
  },
});

if (!values.file) {
  console.error('Usage: pnpm sync:ccn --file <path-to-shapefile>');
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

function mapServiceType(raw: string): string {
  const normalized = raw?.toUpperCase().trim();
  if (normalized === 'W' || normalized === 'WATER') return 'water';
  if (normalized === 'S' || normalized === 'SEWER') return 'sewer';
  if (normalized === 'B' || normalized === 'BOTH') return 'both';
  return 'water'; // default
}

async function main() {
  const sql = neon(connectionString!);

  console.log(`Reading shapefile: ${values.file}`);
  const source = await open(values.file!);

  let count = 0;
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
    if (!geometry || !properties) continue;

    const id = `ccn_${createId()}`;
    const ccnNumber = (properties.CCN_NO || properties.ccn_no || '').toString().trim();
    const utilityName = (properties.UTILITY_NA || properties.utility_name || 'Unknown')
      .toString()
      .trim();
    const serviceType = mapServiceType(
      (properties.SERVICE_TY || properties.service_type || 'W').toString()
    );
    const county = (properties.COUNTY || properties.county || 'Unknown').toString().trim();
    const geojson = JSON.stringify(geometry);

    batch.push(
      `INSERT INTO ccn_areas (id, ccn_number, utility_name, service_type, county, boundary)
       VALUES ('${id}', '${ccnNumber.replace(/'/g, "''")}', '${utilityName.replace(/'/g, "''")}', '${serviceType}', '${county.replace(/'/g, "''")}', ST_GeomFromGeoJSON('${geojson}')::geography)
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
  console.log(`Synced ${count} CCN areas successfully.`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
