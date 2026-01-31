/**
 * TxGIO/TNRIS Parcel Lookup Service
 *
 * Provides on-demand parcel data fetching from the TxGIO ArcGIS REST API
 * with local caching in the parcels table.
 *
 * @see https://tnris.org/stratmap/land-parcels.html
 * @see https://feature.geographic.texas.gov/arcgis/rest/services/Parcels/stratmap_land_parcels_48_most_recent/MapServer/0
 */

import { neon } from '@neondatabase/serverless';
import { createId } from '@paralleldrive/cuid2';

// TxGIO ArcGIS REST API endpoint for the "most recent" rolling dataset
const TXGIO_PARCELS_URL =
  'https://feature.geographic.texas.gov/arcgis/rest/services/Parcels/stratmap_land_parcels_48_most_recent/MapServer/0';

// Cache TTL: 90 days (parcel data typically updates annually)
const CACHE_TTL_DAYS = 90;

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

// ============================================================================
// Types
// ============================================================================

/**
 * TxGIO API response feature attributes
 */
interface TxGIOAttributes {
  prop_id?: string;
  geo_id?: string;
  county?: string;
  fips?: string;
  owner_name?: string;
  name_care?: string;
  situs_addr?: string;
  situs_city?: string;
  situs_stat?: string; // Note: TxGIO uses 'situs_stat' not 'situs_state'
  situs_zip?: string;
  mail_addr?: string;
  mail_city?: string;
  mail_stat?: string;
  mail_zip?: string;
  legal_desc?: string;
  legal_area?: number;
  lgl_area_unit?: string; // Note: TxGIO uses 'lgl_area_unit'
  land_value?: number;
  imp_value?: number;
  mkt_value?: number;
  tax_year?: string;
  stat_land_use?: string;
  loc_land_use?: string;
  year_built?: string;
  date_acq?: number; // Timestamp in milliseconds
}

/**
 * GeoJSON Polygon geometry
 */
interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

/**
 * TxGIO API GeoJSON feature
 */
interface TxGIOFeature {
  type: 'Feature';
  properties: TxGIOAttributes;
  geometry: GeoJSONPolygon | null;
}

/**
 * TxGIO API GeoJSON response
 */
interface TxGIOResponse {
  type: 'FeatureCollection';
  features: TxGIOFeature[];
}

/**
 * Parcel data structure returned from lookups
 */
export interface ParcelData {
  id: string;
  propId: string;
  geoId: string | null;
  county: string;
  fips: string | null;
  ownerName: string | null;
  ownerCareOf: string | null;
  situsAddress: string | null;
  situsCity: string | null;
  situsState: string | null;
  situsZip: string | null;
  mailAddress: string | null;
  mailCity: string | null;
  mailState: string | null;
  mailZip: string | null;
  legalDescription: string | null;
  legalArea: number | null;
  legalAreaUnit: string | null;
  landValue: number | null;
  improvementValue: number | null;
  marketValue: number | null;
  taxYear: string | null;
  stateLandUse: string | null;
  localLandUse: string | null;
  yearBuilt: string | null;
  gisArea: number | null;
  sourceUpdatedAt: Date | null;
  fetchedAt: Date;
  fromCache: boolean;
}

/**
 * Result of a parcel lookup operation
 */
export interface ParcelLookupResult {
  parcel: ParcelData | null;
  fromCache: boolean;
  error?: string;
}

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Look up parcel data for a given coordinate
 *
 * First checks the local cache for a parcel containing the point.
 * If not found or stale, queries the TxGIO API and caches the result.
 *
 * @param latitude - Latitude coordinate (WGS84)
 * @param longitude - Longitude coordinate (WGS84)
 * @param options - Lookup options
 * @returns Parcel data or null if not found
 */
export async function lookupParcel(
  latitude: number,
  longitude: number,
  options: { forceRefresh?: boolean } = {}
): Promise<ParcelLookupResult> {
  const sql = getSql();

  try {
    // 1. Check local cache first (point-in-polygon query)
    if (!options.forceRefresh) {
      const cached = await getParcelFromCache(sql, latitude, longitude);
      if (cached) {
        return { parcel: cached, fromCache: true };
      }
    }

    // 2. Query TxGIO API
    const txgioResult = await fetchParcelFromTxGIO(latitude, longitude);
    if (!txgioResult) {
      return { parcel: null, fromCache: false };
    }

    // 3. Cache the result
    const parcel = await cacheParcel(sql, txgioResult);
    return { parcel, fromCache: false };
  } catch (error) {
    console.error('Parcel lookup error:', error);
    return {
      parcel: null,
      fromCache: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Look up parcel data by property ID and county
 *
 * @param propId - TxGIO property ID
 * @param county - County name
 * @returns Parcel data or null if not found
 */
export async function getParcelByPropId(
  propId: string,
  county: string
): Promise<ParcelData | null> {
  const sql = getSql();

  try {
    const rows = (await sql`
      SELECT
        id, prop_id, geo_id, county, fips,
        owner_name, owner_care_of,
        situs_address, situs_city, situs_state, situs_zip,
        mail_address, mail_city, mail_state, mail_zip,
        legal_description, legal_area, legal_area_unit,
        land_value, improvement_value, market_value, tax_year,
        state_land_use, local_land_use, year_built,
        gis_area, source_updated_at, fetched_at
      FROM parcels
      WHERE prop_id = ${propId} AND county = ${county}
      LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (rows.length === 0) {
      return null;
    }

    return mapRowToParcelData(rows[0]!, true);
  } catch (error) {
    console.error('Error fetching parcel by prop_id:', error);
    return null;
  }
}

// ============================================================================
// Cache Operations
// ============================================================================

/**
 * Check local cache for a parcel containing the given point
 */
async function getParcelFromCache(
  sql: ReturnType<typeof getSql>,
  latitude: number,
  longitude: number
): Promise<ParcelData | null> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CACHE_TTL_DAYS);

    const rows = (await sql`
      SELECT
        id, prop_id, geo_id, county, fips,
        owner_name, owner_care_of,
        situs_address, situs_city, situs_state, situs_zip,
        mail_address, mail_city, mail_state, mail_zip,
        legal_description, legal_area, legal_area_unit,
        land_value, improvement_value, market_value, tax_year,
        state_land_use, local_land_use, year_built,
        gis_area, source_updated_at, fetched_at
      FROM parcels
      WHERE ST_Contains(
        boundary::geometry,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      AND fetched_at > ${cutoffDate.toISOString()}
      LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (rows.length === 0) {
      return null;
    }

    return mapRowToParcelData(rows[0]!, true);
  } catch (error) {
    // PostGIS functions may not be available
    console.warn('Cache lookup failed:', error);
    return null;
  }
}

/**
 * Cache a parcel from TxGIO response
 */
async function cacheParcel(
  sql: ReturnType<typeof getSql>,
  feature: TxGIOFeature
): Promise<ParcelData> {
  const attrs = feature.properties;
  const geometry = feature.geometry;

  const id = `prcl_${createId()}`;
  const propId = attrs.prop_id || `unknown_${createId()}`;
  const county = attrs.county || 'UNKNOWN';

  // Convert geometry to WKT for PostGIS
  let boundaryWkt: string | null = null;
  let gisArea: number | null = null;

  if (geometry && geometry.type === 'Polygon') {
    boundaryWkt = polygonToWkt(geometry);
  }

  // Parse source update date (format: "YYYYMMDD" string)
  let sourceUpdatedAt: string | null = null;
  if (attrs.date_acq) {
    const dateStr = String(attrs.date_acq);
    if (dateStr.length === 8) {
      // Parse YYYYMMDD format
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      sourceUpdatedAt = new Date(`${year}-${month}-${day}`).toISOString();
    }
  }

  try {
    // Use ON CONFLICT to handle concurrent inserts
    if (boundaryWkt) {
      // Insert with geometry and calculate area
      await sql`
        INSERT INTO parcels (
          id, prop_id, geo_id, county, fips,
          owner_name, owner_care_of,
          situs_address, situs_city, situs_state, situs_zip,
          mail_address, mail_city, mail_state, mail_zip,
          legal_description, legal_area, legal_area_unit,
          land_value, improvement_value, market_value, tax_year,
          state_land_use, local_land_use, year_built,
          boundary, gis_area, source_updated_at, fetched_at, created_at
        )
        VALUES (
          ${id}, ${propId}, ${attrs.geo_id || null}, ${county}, ${attrs.fips || null},
          ${attrs.owner_name || null}, ${attrs.name_care || null},
          ${attrs.situs_addr || null}, ${attrs.situs_city || null}, ${attrs.situs_stat || 'TX'}, ${attrs.situs_zip || null},
          ${attrs.mail_addr || null}, ${attrs.mail_city || null}, ${attrs.mail_stat || null}, ${attrs.mail_zip || null},
          ${attrs.legal_desc || null}, ${attrs.legal_area || null}, ${attrs.lgl_area_unit || null},
          ${attrs.land_value || null}, ${attrs.imp_value || null}, ${attrs.mkt_value || null}, ${attrs.tax_year || null},
          ${attrs.stat_land_use || null}, ${attrs.loc_land_use || null}, ${attrs.year_built || null},
          ST_GeomFromText(${boundaryWkt}, 4326)::geography,
          ST_Area(ST_GeomFromText(${boundaryWkt}, 4326)::geography),
          ${sourceUpdatedAt},
          NOW(), NOW()
        )
        ON CONFLICT (prop_id, county)
        DO UPDATE SET
          geo_id = EXCLUDED.geo_id,
          fips = EXCLUDED.fips,
          owner_name = EXCLUDED.owner_name,
          owner_care_of = EXCLUDED.owner_care_of,
          situs_address = EXCLUDED.situs_address,
          situs_city = EXCLUDED.situs_city,
          situs_state = EXCLUDED.situs_state,
          situs_zip = EXCLUDED.situs_zip,
          mail_address = EXCLUDED.mail_address,
          mail_city = EXCLUDED.mail_city,
          mail_state = EXCLUDED.mail_state,
          mail_zip = EXCLUDED.mail_zip,
          legal_description = EXCLUDED.legal_description,
          legal_area = EXCLUDED.legal_area,
          legal_area_unit = EXCLUDED.legal_area_unit,
          land_value = EXCLUDED.land_value,
          improvement_value = EXCLUDED.improvement_value,
          market_value = EXCLUDED.market_value,
          tax_year = EXCLUDED.tax_year,
          state_land_use = EXCLUDED.state_land_use,
          local_land_use = EXCLUDED.local_land_use,
          year_built = EXCLUDED.year_built,
          boundary = EXCLUDED.boundary,
          gis_area = EXCLUDED.gis_area,
          source_updated_at = EXCLUDED.source_updated_at,
          fetched_at = NOW()
        RETURNING gis_area
      `;

      // Get the calculated area
      const areaResult = (await sql`
        SELECT gis_area FROM parcels WHERE prop_id = ${propId} AND county = ${county}
      `) as Array<{ gis_area: number | null }>;
      if (areaResult.length > 0) {
        gisArea = areaResult[0]!.gis_area;
      }
    } else {
      // Insert without geometry
      await sql`
        INSERT INTO parcels (
          id, prop_id, geo_id, county, fips,
          owner_name, owner_care_of,
          situs_address, situs_city, situs_state, situs_zip,
          mail_address, mail_city, mail_state, mail_zip,
          legal_description, legal_area, legal_area_unit,
          land_value, improvement_value, market_value, tax_year,
          state_land_use, local_land_use, year_built,
          source_updated_at, fetched_at, created_at
        )
        VALUES (
          ${id}, ${propId}, ${attrs.geo_id || null}, ${county}, ${attrs.fips || null},
          ${attrs.owner_name || null}, ${attrs.name_care || null},
          ${attrs.situs_addr || null}, ${attrs.situs_city || null}, ${attrs.situs_stat || 'TX'}, ${attrs.situs_zip || null},
          ${attrs.mail_addr || null}, ${attrs.mail_city || null}, ${attrs.mail_stat || null}, ${attrs.mail_zip || null},
          ${attrs.legal_desc || null}, ${attrs.legal_area || null}, ${attrs.lgl_area_unit || null},
          ${attrs.land_value || null}, ${attrs.imp_value || null}, ${attrs.mkt_value || null}, ${attrs.tax_year || null},
          ${attrs.stat_land_use || null}, ${attrs.loc_land_use || null}, ${attrs.year_built || null},
          ${sourceUpdatedAt},
          NOW(), NOW()
        )
        ON CONFLICT (prop_id, county)
        DO UPDATE SET
          geo_id = EXCLUDED.geo_id,
          fips = EXCLUDED.fips,
          owner_name = EXCLUDED.owner_name,
          owner_care_of = EXCLUDED.owner_care_of,
          situs_address = EXCLUDED.situs_address,
          situs_city = EXCLUDED.situs_city,
          situs_state = EXCLUDED.situs_state,
          situs_zip = EXCLUDED.situs_zip,
          mail_address = EXCLUDED.mail_address,
          mail_city = EXCLUDED.mail_city,
          mail_state = EXCLUDED.mail_state,
          mail_zip = EXCLUDED.mail_zip,
          legal_description = EXCLUDED.legal_description,
          legal_area = EXCLUDED.legal_area,
          legal_area_unit = EXCLUDED.legal_area_unit,
          land_value = EXCLUDED.land_value,
          improvement_value = EXCLUDED.improvement_value,
          market_value = EXCLUDED.market_value,
          tax_year = EXCLUDED.tax_year,
          state_land_use = EXCLUDED.state_land_use,
          local_land_use = EXCLUDED.local_land_use,
          year_built = EXCLUDED.year_built,
          source_updated_at = EXCLUDED.source_updated_at,
          fetched_at = NOW()
      `;
    }

    // Fetch the cached record to get the canonical ID
    const result = await getParcelByPropId(propId, county);
    if (result) {
      return result;
    }

    // Fallback: return constructed data
    return {
      id,
      propId,
      geoId: attrs.geo_id || null,
      county,
      fips: attrs.fips || null,
      ownerName: attrs.owner_name || null,
      ownerCareOf: attrs.name_care || null,
      situsAddress: attrs.situs_addr || null,
      situsCity: attrs.situs_city || null,
      situsState: attrs.situs_stat || 'TX',
      situsZip: attrs.situs_zip || null,
      mailAddress: attrs.mail_addr || null,
      mailCity: attrs.mail_city || null,
      mailState: attrs.mail_stat || null,
      mailZip: attrs.mail_zip || null,
      legalDescription: attrs.legal_desc || null,
      legalArea: attrs.legal_area || null,
      legalAreaUnit: attrs.lgl_area_unit || null,
      landValue: attrs.land_value || null,
      improvementValue: attrs.imp_value || null,
      marketValue: attrs.mkt_value || null,
      taxYear: attrs.tax_year || null,
      stateLandUse: attrs.stat_land_use || null,
      localLandUse: attrs.loc_land_use || null,
      yearBuilt: attrs.year_built || null,
      gisArea,
      sourceUpdatedAt: sourceUpdatedAt ? new Date(sourceUpdatedAt) : null,
      fetchedAt: new Date(),
      fromCache: false,
    };
  } catch (error) {
    console.error('Error caching parcel:', error);
    throw error;
  }
}

// ============================================================================
// TxGIO API
// ============================================================================

/**
 * Fetch parcel from TxGIO ArcGIS REST API
 *
 * @param latitude - Latitude (WGS84)
 * @param longitude - Longitude (WGS84)
 * @returns TxGIO feature or null if not found
 */
async function fetchParcelFromTxGIO(
  latitude: number,
  longitude: number
): Promise<TxGIOFeature | null> {
  try {
    const url = new URL(`${TXGIO_PARCELS_URL}/query`);
    url.searchParams.set('geometry', `${longitude},${latitude}`);
    url.searchParams.set('geometryType', 'esriGeometryPoint');
    url.searchParams.set('inSR', '4326'); // Input coordinates are WGS84
    url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
    url.searchParams.set('outFields', '*');
    url.searchParams.set('returnGeometry', 'true');
    url.searchParams.set('outSR', '4326'); // Request WGS84 coordinates in response
    url.searchParams.set('f', 'geojson');

    const response = await fetch(url.toString(), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('TxGIO API error:', response.status, response.statusText);
      return null;
    }

    const data = (await response.json()) as TxGIOResponse;

    if (!data.features || data.features.length === 0) {
      return null;
    }

    return data.features[0]!;
  } catch (error) {
    console.error('Error fetching from TxGIO:', error);
    return null;
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Convert GeoJSON Polygon to WKT format
 */
function polygonToWkt(polygon: GeoJSONPolygon): string {
  const rings = polygon.coordinates.map((ring) => {
    const points = ring.map((coord) => `${coord[0]} ${coord[1]}`).join(', ');
    return `(${points})`;
  });
  return `POLYGON(${rings.join(', ')})`;
}

/**
 * Map database row to ParcelData object
 */
function mapRowToParcelData(row: Record<string, unknown>, fromCache: boolean): ParcelData {
  return {
    id: row.id as string,
    propId: row.prop_id as string,
    geoId: row.geo_id as string | null,
    county: row.county as string,
    fips: row.fips as string | null,
    ownerName: row.owner_name as string | null,
    ownerCareOf: row.owner_care_of as string | null,
    situsAddress: row.situs_address as string | null,
    situsCity: row.situs_city as string | null,
    situsState: row.situs_state as string | null,
    situsZip: row.situs_zip as string | null,
    mailAddress: row.mail_address as string | null,
    mailCity: row.mail_city as string | null,
    mailState: row.mail_state as string | null,
    mailZip: row.mail_zip as string | null,
    legalDescription: row.legal_description as string | null,
    legalArea: row.legal_area as number | null,
    legalAreaUnit: row.legal_area_unit as string | null,
    landValue: row.land_value as number | null,
    improvementValue: row.improvement_value as number | null,
    marketValue: row.market_value as number | null,
    taxYear: row.tax_year as string | null,
    stateLandUse: row.state_land_use as string | null,
    localLandUse: row.local_land_use as string | null,
    yearBuilt: row.year_built as string | null,
    gisArea: row.gis_area as number | null,
    sourceUpdatedAt: row.source_updated_at ? new Date(row.source_updated_at as string) : null,
    fetchedAt: new Date(row.fetched_at as string),
    fromCache,
  };
}

/**
 * Create a snapshot of parcel data for storing in lead_intelligence.parcel_data
 *
 * This creates a lightweight JSON object suitable for JSONB storage,
 * preserving key information at the time of analysis.
 */
export function createParcelSnapshot(parcel: ParcelData): Record<string, unknown> {
  return {
    id: parcel.id,
    propId: parcel.propId,
    geoId: parcel.geoId,
    county: parcel.county,
    fips: parcel.fips,
    ownerName: parcel.ownerName,
    ownerCareOf: parcel.ownerCareOf,
    situsAddress: parcel.situsAddress,
    situsCity: parcel.situsCity,
    situsState: parcel.situsState,
    situsZip: parcel.situsZip,
    mailAddress: parcel.mailAddress,
    mailCity: parcel.mailCity,
    mailState: parcel.mailState,
    mailZip: parcel.mailZip,
    legalDescription: parcel.legalDescription,
    legalArea: parcel.legalArea,
    legalAreaUnit: parcel.legalAreaUnit,
    landValue: parcel.landValue,
    improvementValue: parcel.improvementValue,
    marketValue: parcel.marketValue,
    taxYear: parcel.taxYear,
    stateLandUse: parcel.stateLandUse,
    localLandUse: parcel.localLandUse,
    yearBuilt: parcel.yearBuilt,
    gisArea: parcel.gisArea,
    sourceUpdatedAt: parcel.sourceUpdatedAt?.toISOString() || null,
    fetchedAt: parcel.fetchedAt.toISOString(),
  };
}

// ============================================================================
// Land Use Code Mapping
// ============================================================================

/**
 * Texas Land Use Code to Property Type mapping
 *
 * Common TxGIO stat_land_use codes:
 * - A1: Single-family residence
 * - A2: Multi-family residence (duplex, triplex, etc.)
 * - B1: Multi-family apartment complex
 * - C1: Vacant residential land
 * - D1: Agricultural land
 * - E1: Farm/ranch improvements
 * - F1: Commercial real property
 * - G1: Oil, gas, minerals
 * - J1: Utilities
 * - L1: Industrial
 * - M1: Manufactured housing
 * - MH: Mobile home on rented land
 *
 * Local land use codes vary by county but often include:
 * - RES: Residential
 * - COM: Commercial
 * - AGR: Agricultural
 * - VAC: Vacant
 */
export type PropertyType =
  | 'singlewide'
  | 'doublewide'
  | 'land_only'
  | 'land_with_home'
  | 'park'
  | 'other';

/**
 * Map TxGIO land use codes to our property type enum
 *
 * @param stateLandUse - TxGIO stat_land_use code (e.g., "A1", "M1,M1")
 * @param localLandUse - TxGIO loc_land_use code (e.g., "RES", "MH")
 * @returns Suggested property type or null if unclear
 */
export function mapLandUseToPropertyType(
  stateLandUse: string | null,
  localLandUse: string | null
): PropertyType | null {
  if (!stateLandUse && !localLandUse) {
    return null;
  }

  // Normalize codes (handle comma-separated values like "A1,A1")
  const stateCode = stateLandUse?.split(',')[0]?.trim().toUpperCase() || '';
  const localCode = localLandUse?.trim().toUpperCase() || '';

  // Check for manufactured housing first (most specific for our use case)
  if (
    stateCode === 'M1' ||
    stateCode === 'MH' ||
    localCode === 'MH' ||
    localCode === 'MOBILE' ||
    localCode.includes('MANUFACT') ||
    localCode.includes('MFG')
  ) {
    // M1 typically means manufactured home - could be singlewide or doublewide
    // Without more info, default to singlewide as it's more common
    return 'singlewide';
  }

  // Check for mobile home parks
  if (
    localCode.includes('PARK') ||
    localCode.includes('MHP') ||
    localCode.includes('TRAILER')
  ) {
    return 'park';
  }

  // Vacant land codes
  if (
    stateCode === 'C1' ||
    stateCode === 'D1' ||
    localCode === 'VAC' ||
    localCode === 'VACANT' ||
    localCode.includes('AGRI')
  ) {
    return 'land_only';
  }

  // Residential with improvements
  if (stateCode === 'A1' || stateCode === 'A2' || localCode === 'RES') {
    // Could be land with home (site-built) or manufactured
    // Default to land_with_home for residential
    return 'land_with_home';
  }

  return null;
}

/**
 * Get a human-readable description of the land use code
 */
export function getLandUseDescription(
  stateLandUse: string | null,
  localLandUse: string | null
): string | null {
  if (!stateLandUse && !localLandUse) {
    return null;
  }

  const stateCode = stateLandUse?.split(',')[0]?.trim().toUpperCase() || '';
  const localCode = localLandUse?.trim().toUpperCase() || '';

  // Map state codes to descriptions
  const stateDescriptions: Record<string, string> = {
    A1: 'Single-Family Residential',
    A2: 'Multi-Family Residential',
    B1: 'Apartment Complex',
    C1: 'Vacant Residential Land',
    D1: 'Agricultural Land',
    E1: 'Farm/Ranch Improvements',
    F1: 'Commercial Property',
    G1: 'Minerals/Oil & Gas',
    J1: 'Utilities',
    L1: 'Industrial',
    M1: 'Manufactured Housing',
    MH: 'Mobile Home',
  };

  const stateDesc = stateDescriptions[stateCode];
  if (stateDesc) {
    return localCode ? `${stateDesc} (${localCode})` : stateDesc;
  }

  // Fallback to local code if no state code match
  if (localCode) {
    const localDescriptions: Record<string, string> = {
      RES: 'Residential',
      COM: 'Commercial',
      AGR: 'Agricultural',
      VAC: 'Vacant',
      MH: 'Mobile Home',
      IND: 'Industrial',
    };
    return localDescriptions[localCode] || localCode;
  }

  return stateLandUse || localLandUse;
}
