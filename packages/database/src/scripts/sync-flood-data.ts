/**
 * FEMA Flood Zone Data Sync Script
 *
 * Parses FEMA National Flood Hazard Layer (NFHL) shapefiles and inserts into flood_zones table.
 * Filters to MVP counties: Bexar, Hidalgo, Cameron, Nueces, Travis
 *
 * Usage:
 *   pnpm --filter @dealforge/database sync:flood [path-to-shapefile.zip]
 *
 * Data source: FEMA NFHL
 * https://www.fema.gov/flood-maps/national-flood-hazard-layer
 */

import { config } from 'dotenv';
import { createId } from '@paralleldrive/cuid2';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';

// Load environment
config({ path: '../../.env.local' });

// MVP counties for Phase 2
const MVP_COUNTIES = ['Bexar', 'Hidalgo', 'Cameron', 'Nueces', 'Travis'];

// FEMA flood zone descriptions
const ZONE_DESCRIPTIONS: Record<string, string> = {
  A: 'Special Flood Hazard Area - 1% annual chance flood',
  AE: 'Special Flood Hazard Area with base flood elevation',
  AH: 'Special Flood Hazard Area - shallow flooding',
  AO: 'Special Flood Hazard Area - sheet flow',
  AR: 'Special Flood Hazard Area - levee restoration',
  A99: 'Special Flood Hazard Area - flood control system under construction',
  V: 'Coastal Special Flood Hazard Area',
  VE: 'Coastal Special Flood Hazard Area with base flood elevation',
  B: 'Moderate flood hazard area - 0.2% annual chance',
  X: 'Minimal flood hazard area',
  C: 'Minimal flood hazard area',
  D: 'Undetermined flood hazard',
};

// High risk zone codes
const HIGH_RISK_ZONES = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'];

interface FloodFeatureProperties {
  FLD_ZONE?: string;
  ZONE_SUBTY?: string;
  FLOODZONE?: string;
  flood_zone?: string;
  SFHA_TF?: string;
  STATIC_BFE?: number;
  COUNTY?: string;
  county?: string;
  CO_FIPS?: string;
  EFF_DATE?: string;
  [key: string]: unknown;
}

interface GeoJsonFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
  properties: FloodFeatureProperties;
}

interface GeoJsonCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

/**
 * Parse zone code from feature properties
 */
function parseZoneCode(props: FloodFeatureProperties): string {
  const zone = props.FLD_ZONE || props.FLOODZONE || props.flood_zone || 'X';
  const subtype = props.ZONE_SUBTY || '';

  // Combine zone and subtype for full code
  if (subtype && subtype !== zone) {
    return `${zone} ${subtype}`.trim();
  }
  return zone.toUpperCase();
}

/**
 * Extract base zone code from a full zone code
 */
function getBaseZone(zoneCode: string): string {
  const spaceIndex = zoneCode.indexOf(' ');
  return spaceIndex > 0 ? zoneCode.slice(0, spaceIndex).toUpperCase() : zoneCode.toUpperCase();
}

/**
 * Get zone description
 */
function getZoneDescription(zoneCode: string): string {
  const baseZone = getBaseZone(zoneCode);
  return ZONE_DESCRIPTIONS[baseZone] ?? `Flood zone ${zoneCode}`;
}

/**
 * Determine risk level from zone code
 */
function getRiskLevel(zoneCode: string): 'high' | 'moderate' | 'low' | 'undetermined' {
  const baseZone = getBaseZone(zoneCode);

  if (HIGH_RISK_ZONES.includes(baseZone)) {
    return 'high';
  }

  if (baseZone === 'B' || zoneCode.toUpperCase().includes('SHADED')) {
    return 'moderate';
  }

  if (baseZone === 'D') {
    return 'undetermined';
  }

  return 'low';
}

/**
 * Normalize county name
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
 * Ensure geometry is valid GeoJSON for PostGIS
 */
function normalizeGeometry(geometry: GeoJsonFeature['geometry']): string {
  // PostGIS can handle both Polygon and MultiPolygon
  return JSON.stringify(geometry);
}

async function syncFloodData(shapefilePath?: string) {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  if (shapefilePath) {
    console.log('Loading FEMA flood zone shapefile:', shapefilePath);

    // Dynamic import for shpjs (ESM module)
    const shpjs = await import('shpjs');
    const shp = shpjs.default || shpjs;

    const buffer = fs.readFileSync(shapefilePath);
    const geojson = (await shp(buffer)) as GeoJsonCollection | GeoJsonCollection[];

    const collections = Array.isArray(geojson) ? geojson : [geojson];

    let insertedCount = 0;
    let skippedCount = 0;
    const zoneCounts: Record<string, number> = {};

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

        const zoneCode = parseZoneCode(props);
        const zoneDescription = getZoneDescription(zoneCode);
        const effectiveDate = props.EFF_DATE ? new Date(props.EFF_DATE) : null;

        const id = `fz_${createId()}`;
        const boundaryGeoJson = normalizeGeometry(feature.geometry);

        // Track zone distribution
        const baseZone = getBaseZone(zoneCode);
        zoneCounts[baseZone] = (zoneCounts[baseZone] ?? 0) + 1;

        try {
          await sql`
            INSERT INTO flood_zones (id, zone_code, zone_description, county, boundary, effective_date, created_at)
            VALUES (
              ${id},
              ${zoneCode},
              ${zoneDescription},
              ${county},
              ST_GeomFromGeoJSON(${boundaryGeoJson})::geography,
              ${effectiveDate},
              NOW()
            )
          `;
          insertedCount++;

          if (insertedCount % 100 === 0) {
            console.log(`Inserted ${insertedCount} flood zones...`);
          }
        } catch (error) {
          console.error('Error inserting flood zone:', error);
          skippedCount++;
        }
      }
    }

    console.log(`\nSync complete:`);
    console.log(`  Inserted: ${insertedCount} flood zones`);
    console.log(`  Skipped: ${skippedCount} (non-MVP counties or errors)`);
    console.log(`\nZone distribution:`);
    for (const [zone, count] of Object.entries(zoneCounts).sort()) {
      const riskLevel = getRiskLevel(zone);
      console.log(`  ${zone}: ${count} (${riskLevel} risk)`);
    }
  } else {
    console.log(`
FEMA Flood Zone Data Sync Script
=================================

This script loads FEMA National Flood Hazard Layer (NFHL) data for
flood zones in Texas.

Data Source:
  FEMA NFHL
  https://www.fema.gov/flood-maps/national-flood-hazard-layer

  Texas-specific data:
  https://msc.fema.gov/portal/advanceSearch

Instructions:
1. Download the NFHL shapefile for Texas counties from FEMA MSC
2. Run: pnpm --filter @dealforge/database sync:flood path/to/nfhl-shapefile.zip

MVP Counties (Phase 2):
  ${MVP_COUNTIES.join(', ')}

Flood Zone Types:
  High Risk (SFHA):    A, AE, AH, AO, AR, A99, V, VE
  Moderate Risk:       B, X (shaded)
  Low Risk:            C, X (unshaded)
  Undetermined:        D

Note: Only data for MVP counties will be loaded.
    `);
  }

  // Show current counts
  const result = await sql`SELECT COUNT(*) as count FROM flood_zones`;
  console.log(`\nCurrent flood zones in database: ${result[0]?.count || 0}`);

  // Show risk distribution if data exists
  const riskDistribution = await sql`
    SELECT
      CASE
        WHEN zone_code IN ('A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE') THEN 'high'
        WHEN zone_code = 'B' OR zone_code LIKE '%SHADED%' THEN 'moderate'
        WHEN zone_code = 'D' THEN 'undetermined'
        ELSE 'low'
      END as risk_level,
      COUNT(*) as count
    FROM flood_zones
    GROUP BY 1
    ORDER BY 1
  `;

  if (riskDistribution.length > 0) {
    console.log('\nRisk level distribution:');
    for (const row of riskDistribution) {
      console.log(`  ${row.risk_level}: ${row.count}`);
    }
  }
}

// Run if called directly
const args = process.argv.slice(2);
syncFloodData(args[0]).catch(console.error);
