/**
 * Sync CCN (Certificate of Convenience and Necessity) data
 *
 * Parses PUC Texas CCN shapefiles and loads them into the ccn_areas table.
 *
 * Usage:
 *   pnpm sync:ccn --file <path-to-shapefile> --service-type <water|sewer|both>
 *
 * The shapefile should contain CCN boundary polygons with attributes:
 * - CCN_NO: CCN certificate number
 * - UTILITY or UTILITY_NA: Utility name
 * - COUNTY: County name
 *
 * The --service-type flag is required since PUC Texas distributes water and
 * sewer CCNs as separate shapefiles without a service type attribute.
 */

import { parseArgs } from 'node:util';
import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';
import { open } from 'shapefile';
import { config } from 'dotenv';
config({ path: ['.env.local', '.env'] });

const { values } = parseArgs({
  options: {
    file: { type: 'string', short: 'f' },
    'service-type': { type: 'string', short: 's' },
  },
});

if (!values.file || !values['service-type']) {
  console.error(
    'Usage: pnpm sync:ccn --file <path-to-shapefile> --service-type <water|sewer|both>'
  );
  process.exit(1);
}

const validServiceTypes = ['water', 'sewer', 'both'];
if (!validServiceTypes.includes(values['service-type'])) {
  console.error(`Invalid service type: ${values['service-type']}. Must be one of: water, sewer, both`);
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  const sql = neon(connectionString!);
  const serviceType = values['service-type']!;

  console.log(`Reading shapefile: ${values.file}`);
  console.log(`Service type: ${serviceType}`);
  const source = await open(values.file!);

  let count = 0;
  let skipped = 0;
  let pending: Promise<unknown>[] = [];
  const CONCURRENCY = 10;

  async function flushPending() {
    if (pending.length === 0) return;
    await Promise.all(pending);
    pending = [];
  }

  while (true) {
    const result = await source.read();
    if (result.done) break;

    const { properties, geometry } = result.value;
    if (!geometry || !properties) {
      skipped++;
      continue;
    }

    const id = `ccn_${createId()}`;
    const ccnNumber = (properties.CCN_NO || properties.ccn_no || '').toString().trim();
    const utilityName = (
      properties.UTILITY || properties.UTILITY_NA || properties.utility_name || 'Unknown'
    )
      .toString()
      .trim();
    const county = (properties.COUNTY || properties.county || 'Unknown').toString().trim();
    const geojson = JSON.stringify(geometry);

    const esc = (s: string) => s.replace(/'/g, "''");

    pending.push(
      sql(
        `INSERT INTO ccn_areas (id, ccn_number, utility_name, service_type, county, boundary)
         VALUES ($1, $2, $3, $4, $5, ST_GeomFromGeoJSON($6)::geography)
         ON CONFLICT (id) DO NOTHING`,
        [id, esc(ccnNumber), esc(utilityName), serviceType, esc(county), geojson]
      )
    );

    count++;

    if (pending.length >= CONCURRENCY) {
      await flushPending();
      if (count % 500 === 0) {
        console.log(`  Processed ${count} features...`);
      }
    }
  }

  await flushPending();
  console.log(`Synced ${count} CCN areas (${skipped} skipped).`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
