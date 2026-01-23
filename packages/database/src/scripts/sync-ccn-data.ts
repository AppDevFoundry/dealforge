/**
 * CCN (Certificate of Convenience and Necessity) Data Sync Script
 *
 * Parses Texas PUC CCN shapefiles and inserts into ccn_areas table.
 * Filters to MVP counties: Bexar, Hidalgo, Cameron, Nueces, Travis
 *
 * Usage:
 *   pnpm --filter @dealforge/database sync:ccn [path-to-shapefile.zip]
 *
 * Data source: Texas Public Utility Commission
 * GIS Download: https://www.puc.texas.gov/industry/water/utilities/gis/
 * Online Viewer: https://www.puc.texas.gov/industry/water/utilities/map.aspx
 */

import { config } from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';

// Load environment
config({ path: '../../.env.local' });

// MVP counties for Phase 2
const MVP_COUNTIES = ['Bexar', 'Hidalgo', 'Cameron', 'Nueces', 'Travis'];

interface CcnFeatureProperties {
  CCN_NUMBER?: string;
  ccn_number?: string;
  UTILITY_NA?: string;
  utility_name?: string;
  UTILITY_NAME?: string;
  SERVICE_TY?: string;
  service_type?: string;
  SERVICE_TYPE?: string;
  COUNTY?: string;
  county?: string;
  [key: string]: unknown;
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: CcnFeatureProperties;
}

interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

/**
 * Parse service type from shapefile properties
 */
function parseServiceType(props: CcnFeatureProperties): 'water' | 'sewer' | 'both' {
  const serviceType = (
    props.SERVICE_TY ||
    props.service_type ||
    props.SERVICE_TYPE ||
    ''
  )
    .toString()
    .toLowerCase();

  if (serviceType.includes('water') && serviceType.includes('sewer')) {
    return 'both';
  }
  if (serviceType.includes('sewer') || serviceType.includes('wastewater')) {
    return 'sewer';
  }
  return 'water';
}

/**
 * Normalize county name
 */
function normalizeCounty(county: string | undefined): string | null {
  if (!county) return null;
  // Capitalize first letter of each word
  return county
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert MultiPolygon to Polygon (take first polygon) if needed
 */
function normalizeGeometry(geometry: GeoJsonFeature['geometry']): string {
  if (geometry.type === 'MultiPolygon') {
    // Take the first polygon from the multipolygon
    const firstPolygon = geometry.coordinates[0];
    return JSON.stringify({
      type: 'Polygon',
      coordinates: firstPolygon,
    });
  }
  return JSON.stringify(geometry);
}

async function syncCcnData(shapefilePath?: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  // If a shapefile path is provided, parse it
  // Otherwise, show instructions for manual data loading
  if (shapefilePath) {
    console.log('Loading CCN shapefile:', shapefilePath);

    // Dynamic import for shpjs (ESM module)
    const shpjs = await import('shpjs');
    const shp = shpjs.default || shpjs;

    const buffer = fs.readFileSync(shapefilePath);
    const geojson = (await shp(buffer)) as GeoJsonCollection | GeoJsonCollection[];

    // Handle both single and array results from shpjs
    const collections = Array.isArray(geojson) ? geojson : [geojson];

    let insertedCount = 0;
    let skippedCount = 0;

    for (const collection of collections) {
      if (!collection.features) continue;

      for (const feature of collection.features) {
        const props = feature.properties;
        const county = normalizeCounty(props.COUNTY || props.county);

        // Filter to MVP counties
        if (county && !MVP_COUNTIES.includes(county)) {
          skippedCount++;
          continue;
        }

        const ccnNumber = props.CCN_NUMBER || props.ccn_number || null;
        const utilityName =
          props.UTILITY_NA || props.utility_name || props.UTILITY_NAME || 'Unknown Utility';
        const serviceType = parseServiceType(props);

        const id = `ccn_${createId()}`;
        const boundaryGeoJson = normalizeGeometry(feature.geometry);

        try {
          await sql`
            INSERT INTO ccn_areas (id, ccn_number, utility_name, service_type, county, boundary, created_at)
            VALUES (
              ${id},
              ${ccnNumber},
              ${utilityName},
              ${serviceType},
              ${county},
              ST_GeomFromGeoJSON(${boundaryGeoJson})::geography,
              NOW()
            )
          `;
          insertedCount++;

          if (insertedCount % 100 === 0) {
            console.log(`Inserted ${insertedCount} CCN areas...`);
          }
        } catch (error) {
          console.error('Error inserting CCN area:', error);
          skippedCount++;
        }
      }
    }

    console.log(`\nSync complete:`);
    console.log(`  Inserted: ${insertedCount} CCN areas`);
    console.log(`  Skipped: ${skippedCount} (non-MVP counties or errors)`);
  } else {
    // Show instructions for obtaining and loading data
    console.log(`
CCN Data Sync Script
====================

This script loads CCN (Certificate of Convenience and Necessity) data for
water and sewer utilities in Texas.

Data Source:
  Texas Public Utility Commission
  GIS Download: https://www.puc.texas.gov/industry/water/utilities/gis/
  Online Viewer: https://www.puc.texas.gov/industry/water/utilities/map.aspx

Instructions:
1. Go to https://www.puc.texas.gov/industry/water/utilities/gis/
2. Download the CCN shapefile (statewide dataset)
3. Run: pnpm --filter @dealforge/database sync:ccn path/to/ccn-shapefile.zip

MVP Counties (Phase 2):
  ${MVP_COUNTIES.join(', ')}

Note: Only data for MVP counties will be loaded to keep the database manageable.
    `);
  }

  // Show current counts
  const result = await sql`SELECT COUNT(*) as count FROM ccn_areas`;
  console.log(`\nCurrent CCN areas in database: ${result[0]?.count || 0}`);
}

// Run if called directly
const args = process.argv.slice(2);
syncCcnData(args[0]).catch(console.error);
