/**
 * CCN (Certificate of Convenience and Necessity) Data Sync Script
 *
 * Parses Texas PUC CCN shapefiles and inserts into ccn_areas table.
 * Filters to MVP counties: Bexar, Hidalgo, Cameron, Nueces, Travis
 *
 * Usage:
 *   pnpm --filter @dealforge/database sync:ccn [path-to-shapefile.zip] [service-type]
 *
 * Arguments:
 *   path-to-shapefile.zip - Path to the CCN shapefile
 *   service-type - Optional: 'water', 'sewer', or 'both' (overrides auto-detection)
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

// MVP counties for Phase 2 - Expanded to include Coastal Bend, SA-Corpus corridor, and RGV
const MVP_COUNTIES = [
  // Original MVP
  'Bexar',
  'Travis',
  // Coastal Bend
  'Nueces',
  'San Patricio',
  'Aransas',
  'Kleberg',
  'Jim Wells',
  'Refugio',
  'Calhoun',
  'Victoria',
  'Bee',
  'Live Oak',
  'Brooks',
  // SA to Corpus corridor
  'Karnes',
  'Wilson',
  'Atascosa',
  'Mcmullen',
  'La Salle',
  'Frio',
  'Medina',
  'Uvalde',
  'Goliad',
  // Rio Grande Valley
  'Hidalgo',
  'Cameron',
  'Starr',
  'Zapata',
  'Webb',
  'Jim Hogg',
  'Kenedy',
  'Willacy',
];

interface CcnFeatureProperties {
  // CCN Number variations
  CCN_NO?: string;
  CCN_NUMBER?: string;
  ccn_number?: string;
  // Utility name variations
  UTILITY?: string;
  UTILITY_NA?: string;
  utility_name?: string;
  UTILITY_NAME?: string;
  // Service type variations
  SERVICE_TY?: string;
  service_type?: string;
  SERVICE_TYPE?: string;
  // County variations
  COUNTY?: string;
  county?: string;
  [key: string]: unknown;
}

type GeometryType = 'Polygon' | 'MultiPolygon' | 'LineString' | 'MultiLineString';

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: GeometryType;
    coordinates: number[][] | number[][][] | number[][][][];
  };
  properties: CcnFeatureProperties;
}

/**
 * Check if geometry is a line type (facility) vs polygon (service area)
 */
function isLineGeometry(type: GeometryType): boolean {
  return type === 'LineString' || type === 'MultiLineString';
}

interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

type ServiceType = 'water' | 'sewer' | 'both';

/**
 * Parse service type from shapefile properties or use override
 */
function parseServiceType(
  props: CcnFeatureProperties,
  override?: ServiceType
): ServiceType {
  // If explicit override provided, use it
  if (override) {
    return override;
  }

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
 * Normalize county name (capitalize first letter of each word)
 */
function normalizeCounty(county: string | undefined): string | null {
  if (!county) return null;
  return county
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if a county string matches any MVP county
 * Handles multi-county fields like "CAMERON, WILLACY"
 */
function matchesMvpCounty(countyRaw: string | undefined): string | null {
  if (!countyRaw) return null;

  // Split by comma for multi-county entries
  const counties = countyRaw.split(',').map((c) => normalizeCounty(c.trim()));

  // Return the first matching MVP county
  for (const county of counties) {
    if (county && MVP_COUNTIES.includes(county)) {
      return county;
    }
  }
  return null;
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

async function syncCcnData(shapefilePath?: string, serviceTypeOverride?: ServiceType) {
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
    if (serviceTypeOverride) {
      console.log('Using explicit service type:', serviceTypeOverride);
    }

    // Dynamic import for shpjs (ESM module)
    const shpjs = await import('shpjs');
    const shp = shpjs.default || shpjs;

    const buffer = fs.readFileSync(shapefilePath);
    const geojson = (await shp(buffer)) as GeoJsonCollection | GeoJsonCollection[];

    // Handle both single and array results from shpjs
    const collections = Array.isArray(geojson) ? geojson : [geojson];

    let areasInserted = 0;
    let facilitiesInserted = 0;
    let skippedCount = 0;

    for (const collection of collections) {
      if (!collection.features) continue;

      for (const feature of collection.features) {
        const props = feature.properties;
        const countyRaw = props.COUNTY || props.county;

        // Filter to MVP counties (handles multi-county fields like "CAMERON, WILLACY")
        const county = matchesMvpCounty(countyRaw);
        if (!county) {
          skippedCount++;
          continue;
        }

        const ccnNumber = props.CCN_NO || props.CCN_NUMBER || props.ccn_number || null;
        const utilityName =
          props.UTILITY || props.UTILITY_NA || props.utility_name || props.UTILITY_NAME || 'Unknown Utility';
        const serviceType = parseServiceType(props, serviceTypeOverride);
        const geometryJson = JSON.stringify(feature.geometry);

        // Handle line geometries (facilities) vs polygon geometries (service areas)
        if (isLineGeometry(feature.geometry.type)) {
          // Insert into ccn_facilities table
          const id = `ccnf_${createId()}`;

          try {
            await sql`
              INSERT INTO ccn_facilities (id, ccn_number, utility_name, service_type, county, geometry, created_at)
              VALUES (
                ${id},
                ${ccnNumber},
                ${utilityName},
                ${serviceType},
                ${county},
                ST_GeomFromGeoJSON(${geometryJson})::geography,
                NOW()
              )
            `;
            facilitiesInserted++;

            if (facilitiesInserted % 100 === 0) {
              console.log(`Inserted ${facilitiesInserted} CCN facilities...`);
            }
          } catch (error) {
            console.error('Error inserting CCN facility:', error);
            skippedCount++;
          }
        } else {
          // Insert into ccn_areas table (polygons)
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
            areasInserted++;

            if (areasInserted % 100 === 0) {
              console.log(`Inserted ${areasInserted} CCN areas...`);
            }
          } catch (error) {
            console.error('Error inserting CCN area:', error);
            skippedCount++;
          }
        }
      }
    }

    console.log(`\nSync complete:`);
    console.log(`  Inserted: ${areasInserted} CCN areas (service boundaries)`);
    console.log(`  Inserted: ${facilitiesInserted} CCN facilities (infrastructure lines)`);
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
2. Download the CCN shapefiles (water and sewer separately)
3. Run:
   pnpm --filter @dealforge/database sync:ccn path/to/water.zip water
   pnpm --filter @dealforge/database sync:ccn path/to/sewer.zip sewer

MVP Counties (Phase 2):
  ${MVP_COUNTIES.join(', ')}

Note: Only data for MVP counties will be loaded to keep the database manageable.
    `);
  }

  // Show current counts
  const areasResult = await sql`SELECT COUNT(*) as count FROM ccn_areas`;
  const facilitiesResult = await sql`SELECT COUNT(*) as count FROM ccn_facilities`;
  console.log(`\nCurrent database counts:`);
  console.log(`  CCN areas (service boundaries): ${areasResult[0]?.count || 0}`);
  console.log(`  CCN facilities (infrastructure lines): ${facilitiesResult[0]?.count || 0}`);
}

// Run if called directly
const args = process.argv.slice(2);
const serviceTypeArg = args[1] as ServiceType | undefined;
if (serviceTypeArg && !['water', 'sewer', 'both'].includes(serviceTypeArg)) {
  console.error('Invalid service type. Must be: water, sewer, or both');
  process.exit(1);
}
syncCcnData(args[0], serviceTypeArg).catch(console.error);
