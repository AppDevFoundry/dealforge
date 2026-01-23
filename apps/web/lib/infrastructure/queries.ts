/**
 * Infrastructure spatial queries using PostGIS
 *
 * These functions query CCN utility areas and flood zones using spatial operations.
 * Since Drizzle doesn't natively support PostGIS, we use raw SQL queries.
 */

import type {
  BBox,
  CcnArea,
  CcnFacility,
  CcnFacilityFeature,
  CcnFacilityFeatureCollection,
  CcnFeature,
  CcnFeatureCollection,
  CcnServiceType,
  FloodZone,
  FloodZoneFeature,
  FloodZoneFeatureCollection,
  InfrastructureAtPoint,
} from '@dealforge/types';
import { getFloodRiskLevel } from '@dealforge/types';
import { neon } from '@neondatabase/serverless';

/**
 * Get the Neon SQL client
 */
function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

/**
 * Helper to safely extract string from row
 */
function asString(value: unknown): string {
  return value as string;
}

/**
 * Helper to safely extract string or null from row
 */
function asStringOrNull(value: unknown): string | null {
  return value as string | null;
}

/**
 * Get CCN areas that intersect with a bounding box
 */
export async function getCcnAreasByBbox(
  bbox: BBox,
  serviceType?: CcnServiceType
): Promise<CcnFeatureCollection> {
  const sql = getSql();
  const [minLng, minLat, maxLng, maxLat] = bbox;

  const bboxWkt = `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;

  const rows = serviceType
    ? await sql`
        SELECT
          id,
          ccn_number,
          utility_name,
          service_type,
          county,
          ST_AsGeoJSON(boundary)::json as geometry
        FROM ccn_areas
        WHERE ST_Intersects(boundary, ST_GeogFromText(${bboxWkt}))
          AND service_type = ${serviceType}
        LIMIT 500
      `
    : await sql`
        SELECT
          id,
          ccn_number,
          utility_name,
          service_type,
          county,
          ST_AsGeoJSON(boundary)::json as geometry
        FROM ccn_areas
        WHERE ST_Intersects(boundary, ST_GeogFromText(${bboxWkt}))
        LIMIT 500
      `;

  const features: CcnFeature[] = rows.map((row: Record<string, unknown>) => ({
    type: 'Feature' as const,
    geometry: row.geometry as GeoJSON.Polygon,
    properties: {
      id: asString(row.id),
      ccnNumber: asStringOrNull(row.ccn_number),
      utilityName: asString(row.utility_name),
      serviceType: asString(row.service_type) as CcnServiceType,
      county: asStringOrNull(row.county),
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Get CCN facilities (infrastructure lines) that intersect with a bounding box
 */
export async function getCcnFacilitiesByBbox(
  bbox: BBox,
  serviceType?: CcnServiceType
): Promise<CcnFacilityFeatureCollection> {
  const sql = getSql();
  const [minLng, minLat, maxLng, maxLat] = bbox;

  const bboxWkt = `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;

  const rows = serviceType
    ? await sql`
        SELECT
          id,
          ccn_number,
          utility_name,
          service_type,
          county,
          ST_AsGeoJSON(geometry)::json as geometry
        FROM ccn_facilities
        WHERE ST_Intersects(geometry, ST_GeogFromText(${bboxWkt}))
          AND service_type = ${serviceType}
        LIMIT 1000
      `
    : await sql`
        SELECT
          id,
          ccn_number,
          utility_name,
          service_type,
          county,
          ST_AsGeoJSON(geometry)::json as geometry
        FROM ccn_facilities
        WHERE ST_Intersects(geometry, ST_GeogFromText(${bboxWkt}))
        LIMIT 1000
      `;

  const features: CcnFacilityFeature[] = rows.map((row: Record<string, unknown>) => ({
    type: 'Feature' as const,
    geometry: row.geometry as GeoJSON.LineString | GeoJSON.MultiLineString,
    properties: {
      id: asString(row.id),
      ccnNumber: asStringOrNull(row.ccn_number),
      utilityName: asString(row.utility_name),
      serviceType: asString(row.service_type) as CcnServiceType,
      county: asStringOrNull(row.county),
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Get flood zones that intersect with a bounding box
 */
export async function getFloodZonesByBbox(
  bbox: BBox,
  highRiskOnly = false
): Promise<FloodZoneFeatureCollection> {
  const sql = getSql();
  const [minLng, minLat, maxLng, maxLat] = bbox;

  const bboxWkt = `POLYGON((${minLng} ${minLat}, ${maxLng} ${minLat}, ${maxLng} ${maxLat}, ${minLng} ${maxLat}, ${minLng} ${minLat}))`;

  // High risk zone codes
  const highRiskZones = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'];

  const rows = highRiskOnly
    ? await sql`
        SELECT
          id,
          zone_code,
          zone_description,
          county,
          ST_AsGeoJSON(boundary)::json as geometry
        FROM flood_zones
        WHERE ST_Intersects(boundary, ST_GeogFromText(${bboxWkt}))
          AND split_part(zone_code, ' ', 1) = ANY(${highRiskZones})
        LIMIT 500
      `
    : await sql`
        SELECT
          id,
          zone_code,
          zone_description,
          county,
          ST_AsGeoJSON(boundary)::json as geometry
        FROM flood_zones
        WHERE ST_Intersects(boundary, ST_GeogFromText(${bboxWkt}))
        LIMIT 500
      `;

  const features: FloodZoneFeature[] = rows.map((row: Record<string, unknown>) => ({
    type: 'Feature' as const,
    geometry: row.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
    properties: {
      id: asString(row.id),
      zoneCode: asString(row.zone_code),
      zoneDescription: asStringOrNull(row.zone_description),
      county: asStringOrNull(row.county),
      riskLevel: getFloodRiskLevel(asString(row.zone_code)),
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Get flood zones by county
 */
export async function getFloodZonesByCounty(
  county: string,
  highRiskOnly = false
): Promise<FloodZoneFeatureCollection> {
  const sql = getSql();

  const highRiskZones = ['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE'];

  const rows = highRiskOnly
    ? await sql`
        SELECT
          id,
          zone_code,
          zone_description,
          county,
          ST_AsGeoJSON(boundary)::json as geometry
        FROM flood_zones
        WHERE county = ${county}
          AND split_part(zone_code, ' ', 1) = ANY(${highRiskZones})
        LIMIT 500
      `
    : await sql`
        SELECT
          id,
          zone_code,
          zone_description,
          county,
          ST_AsGeoJSON(boundary)::json as geometry
        FROM flood_zones
        WHERE county = ${county}
        LIMIT 500
      `;

  const features: FloodZoneFeature[] = rows.map((row: Record<string, unknown>) => ({
    type: 'Feature' as const,
    geometry: row.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon,
    properties: {
      id: asString(row.id),
      zoneCode: asString(row.zone_code),
      zoneDescription: asStringOrNull(row.zone_description),
      county: asStringOrNull(row.county),
      riskLevel: getFloodRiskLevel(asString(row.zone_code)),
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Get infrastructure data (CCN areas, facilities, and flood zones) at a specific point
 */
export async function getInfrastructureAtPoint(
  lat: number,
  lng: number
): Promise<InfrastructureAtPoint> {
  const sql = getSql();
  const pointWkt = `POINT(${lng} ${lat})`;

  // Query CCN areas containing the point
  const ccnRows = await sql`
    SELECT
      id,
      ccn_number,
      utility_name,
      service_type,
      county
    FROM ccn_areas
    WHERE ST_Contains(boundary::geometry, ST_GeomFromText(${pointWkt}, 4326))
  `;

  // Query CCN facilities near the point (within 100m since lines don't "contain" points)
  const facilityRows = await sql`
    SELECT
      id,
      ccn_number,
      utility_name,
      service_type,
      county
    FROM ccn_facilities
    WHERE ST_DWithin(geometry, ST_GeogFromText(${pointWkt}), 100)
  `;

  // Query flood zones containing the point
  const floodRows = await sql`
    SELECT
      id,
      zone_code,
      zone_description,
      county
    FROM flood_zones
    WHERE ST_Contains(boundary::geometry, ST_GeomFromText(${pointWkt}, 4326))
  `;

  const ccnAreas: CcnArea[] = ccnRows.map((row: Record<string, unknown>) => ({
    id: asString(row.id),
    ccnNumber: asStringOrNull(row.ccn_number),
    utilityName: asString(row.utility_name),
    serviceType: asString(row.service_type) as CcnServiceType,
    county: asStringOrNull(row.county),
  }));

  const ccnFacilities: CcnFacility[] = facilityRows.map((row: Record<string, unknown>) => ({
    id: asString(row.id),
    ccnNumber: asStringOrNull(row.ccn_number),
    utilityName: asString(row.utility_name),
    serviceType: asString(row.service_type) as CcnServiceType,
    county: asStringOrNull(row.county),
  }));

  const floodZones: FloodZone[] = floodRows.map((row: Record<string, unknown>) => ({
    id: asString(row.id),
    zoneCode: asString(row.zone_code),
    zoneDescription: asStringOrNull(row.zone_description),
    county: asStringOrNull(row.county),
    riskLevel: getFloodRiskLevel(asString(row.zone_code)),
  }));

  return {
    ccnAreas,
    ccnFacilities,
    floodZones,
  };
}

/**
 * Get CCN areas within a radius of a point
 */
export async function getCcnAreasNearPoint(
  lat: number,
  lng: number,
  radiusMeters = 5000,
  serviceType?: CcnServiceType
): Promise<CcnFeatureCollection> {
  const sql = getSql();
  const pointWkt = `POINT(${lng} ${lat})`;

  const rows = serviceType
    ? await sql`
        SELECT
          id,
          ccn_number,
          utility_name,
          service_type,
          county,
          ST_AsGeoJSON(boundary)::json as geometry
        FROM ccn_areas
        WHERE ST_DWithin(boundary, ST_GeogFromText(${pointWkt}), ${radiusMeters})
          AND service_type = ${serviceType}
        LIMIT 100
      `
    : await sql`
        SELECT
          id,
          ccn_number,
          utility_name,
          service_type,
          county,
          ST_AsGeoJSON(boundary)::json as geometry
        FROM ccn_areas
        WHERE ST_DWithin(boundary, ST_GeogFromText(${pointWkt}), ${radiusMeters})
        LIMIT 100
      `;

  const features: CcnFeature[] = rows.map((row: Record<string, unknown>) => ({
    type: 'Feature' as const,
    geometry: row.geometry as GeoJSON.Polygon,
    properties: {
      id: asString(row.id),
      ccnNumber: asStringOrNull(row.ccn_number),
      utilityName: asString(row.utility_name),
      serviceType: asString(row.service_type) as CcnServiceType,
      county: asStringOrNull(row.county),
    },
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}
