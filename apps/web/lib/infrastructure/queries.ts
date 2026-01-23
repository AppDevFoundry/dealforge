import { getDb } from '@dealforge/database/client';
import type {
  CcnAreaProperties,
  CcnServiceType,
  FloodRiskLevel,
  FloodZoneCode,
  FloodZoneProperties,
  GeoJSONFeature,
  GeoJSONFeatureCollection,
} from '@dealforge/types';
import { sql } from 'drizzle-orm';

/**
 * Parse a bounding box string into [minLng, minLat, maxLng, maxLat]
 */
export function parseBbox(bbox: string): [number, number, number, number] | null {
  const parts = bbox.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return null;
  }
  const minLng = parts[0]!;
  const minLat = parts[1]!;
  const maxLng = parts[2]!;
  const maxLat = parts[3]!;
  if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
    return null;
  }
  if (minLng >= maxLng || minLat >= maxLat) {
    return null;
  }
  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Classify a FEMA flood zone code into a risk level
 */
export function classifyFloodRisk(zoneCode: string): FloodRiskLevel {
  const highRisk: string[] = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'];
  if (highRisk.includes(zoneCode)) return 'high';
  if (zoneCode === 'X') return 'low';
  if (zoneCode === 'D') return 'undetermined';
  return 'moderate';
}

/**
 * Query CCN areas within a bounding box, returning GeoJSON
 */
export async function ccnAreasInBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  serviceType?: CcnServiceType
): Promise<GeoJSONFeatureCollection<CcnAreaProperties>> {
  const db = getDb();

  const serviceTypeFilter = serviceType ? sql`AND service_type = ${serviceType}` : sql``;

  const rows = await db.execute(sql`
    SELECT
      id,
      ccn_number,
      utility_name,
      service_type,
      county,
      ST_AsGeoJSON(ST_Simplify(boundary::geometry, 0.001)) as geojson
    FROM ccn_areas
    WHERE ST_Intersects(
      boundary,
      ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)::geography
    )
    ${serviceTypeFilter}
    LIMIT 500
  `);

  return toFeatureCollection(rows.rows, (row) => ({
    id: row.id as string,
    ccnNumber: row.ccn_number as string,
    utilityName: row.utility_name as string,
    serviceType: row.service_type as CcnServiceType,
    county: row.county as string,
  }));
}

/**
 * Query flood zones within a bounding box, returning GeoJSON
 */
export async function floodZonesInBbox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number,
  options?: { county?: string; highRiskOnly?: boolean }
): Promise<GeoJSONFeatureCollection<FloodZoneProperties>> {
  const db = getDb();

  const countyFilter = options?.county ? sql`AND county = ${options.county}` : sql``;

  const highRiskFilter = options?.highRiskOnly
    ? sql`AND zone_code IN ('A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE')`
    : sql``;

  const rows = await db.execute(sql`
    SELECT
      id,
      zone_code,
      zone_description,
      county,
      ST_AsGeoJSON(ST_Simplify(boundary::geometry, 0.001)) as geojson
    FROM flood_zones
    WHERE ST_Intersects(
      boundary,
      ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)::geography
    )
    ${countyFilter}
    ${highRiskFilter}
    LIMIT 500
  `);

  return toFeatureCollection(rows.rows, (row) => ({
    id: row.id as string,
    zoneCode: row.zone_code as FloodZoneCode,
    zoneDescription: (row.zone_description as string) ?? null,
    county: row.county as string,
    riskLevel: classifyFloodRisk(row.zone_code as string),
  }));
}

/**
 * Find CCN areas at a specific point
 */
export async function ccnAreasAtPoint(lat: number, lng: number): Promise<CcnAreaProperties[]> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      id,
      ccn_number,
      utility_name,
      service_type,
      county
    FROM ccn_areas
    WHERE ST_Intersects(
      boundary,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    )
  `);

  return rows.rows.map((row) => ({
    id: row.id as string,
    ccnNumber: row.ccn_number as string,
    utilityName: row.utility_name as string,
    serviceType: row.service_type as CcnServiceType,
    county: row.county as string,
  }));
}

/**
 * Find flood zone at a specific point
 */
export async function floodZoneAtPoint(
  lat: number,
  lng: number
): Promise<FloodZoneProperties | null> {
  const db = getDb();

  const rows = await db.execute(sql`
    SELECT
      id,
      zone_code,
      zone_description,
      county
    FROM flood_zones
    WHERE ST_Intersects(
      boundary,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    )
    LIMIT 1
  `);

  const row = rows.rows[0];
  if (!row) return null;

  return {
    id: row.id as string,
    zoneCode: row.zone_code as FloodZoneCode,
    zoneDescription: (row.zone_description as string) ?? null,
    county: row.county as string,
    riskLevel: classifyFloodRisk(row.zone_code as string),
  };
}

/**
 * Transform database rows into a GeoJSON FeatureCollection
 */
function toFeatureCollection<P>(
  rows: Record<string, unknown>[],
  mapProperties: (row: Record<string, unknown>) => P
): GeoJSONFeatureCollection<P> {
  const features: GeoJSONFeature<P>[] = rows
    .filter((row) => row.geojson != null)
    .map((row) => ({
      type: 'Feature' as const,
      geometry: JSON.parse(row.geojson as string),
      properties: mapProperties(row),
    }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
