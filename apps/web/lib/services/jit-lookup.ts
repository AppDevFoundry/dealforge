/**
 * JIT (Just-In-Time) Lookup Service
 *
 * Provides on-demand data fetching with intelligent caching for:
 * - HUD Fair Market Rents (FMR)
 * - Address geocoding via Mapbox
 * - CCN utility coverage checks
 *
 * This service is used by AI tools and can be used by other parts of the application.
 */

import { type NeonQueryFunction, neon } from '@neondatabase/serverless';

// ============================================================================
// Types
// ============================================================================

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  zipCode: string;
  county?: string;
  city?: string;
  state?: string;
}

export interface UtilityCoverage {
  hasWater: boolean;
  hasSewer: boolean;
  waterProvider?: string;
  sewerProvider?: string;
}

export interface FMRData {
  zipCode: string;
  countyName: string | null;
  metroName: string | null;
  fiscalYear: number;
  efficiency: number | null;
  oneBedroom: number | null;
  twoBedroom: number | null;
  threeBedroom: number | null;
  fourBedroom: number | null;
  suggestedLotRent: { low: number; high: number };
  source: 'cache' | 'api';
}

export interface AddressLookupResult {
  geocode: GeocodeResult | null;
  utilities: UtilityCoverage;
  fmr: FMRData | null;
}

// ============================================================================
// Database Connection
// ============================================================================

let sqlInstance: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sqlInstance = neon(connectionString);
  }
  return sqlInstance;
}

// ============================================================================
// FMR Lookup
// ============================================================================

/**
 * Get Fair Market Rent data for a ZIP code
 *
 * First checks the database cache, then optionally fetches from HUD API
 * if not found and HUD_API_KEY is available.
 *
 * @param zipCode - The ZIP code to look up
 * @param options - Configuration options
 * @returns FMR data or null if not found
 */
export async function getFMR(
  zipCode: string,
  options: { fetchIfMissing?: boolean } = { fetchIfMissing: true }
): Promise<FMRData | null> {
  const sql = getSql();

  // Check database cache first
  const cachedFmr = await getFMRFromCache(sql, zipCode);
  if (cachedFmr) {
    return cachedFmr;
  }

  // Fetch from HUD API if allowed and API key is available
  if (options.fetchIfMissing) {
    const apiKey = process.env.HUD_API_KEY;
    if (apiKey) {
      const apiFmr = await fetchFMRFromHUD(zipCode, apiKey);
      if (apiFmr) {
        // Cache the result in database
        await cacheFMR(sql, apiFmr);
        return apiFmr;
      }
    }
  }

  return null;
}

async function getFMRFromCache(
  sql: NeonQueryFunction<false, false>,
  zipCode: string
): Promise<FMRData | null> {
  try {
    const rows = (await sql`
      SELECT
        zip_code,
        county_name,
        metro_name,
        fiscal_year,
        efficiency,
        one_bedroom,
        two_bedroom,
        three_bedroom,
        four_bedroom
      FROM hud_fair_market_rents
      WHERE zip_code = ${zipCode}
      ORDER BY fiscal_year DESC
      LIMIT 1
    `) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) {
      return null;
    }

    const twoBedroom = row.two_bedroom ? Number(row.two_bedroom) : 0;

    return {
      zipCode: row.zip_code as string,
      countyName: row.county_name as string | null,
      metroName: row.metro_name as string | null,
      fiscalYear: Number(row.fiscal_year),
      efficiency: row.efficiency ? Number(row.efficiency) : null,
      oneBedroom: row.one_bedroom ? Number(row.one_bedroom) : null,
      twoBedroom: row.two_bedroom ? Number(row.two_bedroom) : null,
      threeBedroom: row.three_bedroom ? Number(row.three_bedroom) : null,
      fourBedroom: row.four_bedroom ? Number(row.four_bedroom) : null,
      suggestedLotRent: {
        low: Math.round(twoBedroom * 0.3),
        high: Math.round(twoBedroom * 0.4),
      },
      source: 'cache',
    };
  } catch (error) {
    console.error('Error fetching FMR from cache:', error);
    return null;
  }
}

async function fetchFMRFromHUD(zipCode: string, apiKey: string): Promise<FMRData | null> {
  try {
    const url = `https://www.huduser.gov/hudapi/public/fmr/data/${zipCode}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // ZIP code not found
      }
      console.error('HUD API error:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.data || !data.data.basicdata) {
      return null;
    }

    const basic = data.data.basicdata;
    const currentYear = new Date().getFullYear();
    const twoBedroom = Number(basic.fmr_2) || 0;

    return {
      zipCode,
      countyName: basic.county_name || null,
      metroName: basic.metro_name || null,
      fiscalYear: basic.fiscal_year || currentYear,
      efficiency: basic.fmr_0 ? Number(basic.fmr_0) : null,
      oneBedroom: basic.fmr_1 ? Number(basic.fmr_1) : null,
      twoBedroom: basic.fmr_2 ? Number(basic.fmr_2) : null,
      threeBedroom: basic.fmr_3 ? Number(basic.fmr_3) : null,
      fourBedroom: basic.fmr_4 ? Number(basic.fmr_4) : null,
      suggestedLotRent: {
        low: Math.round(twoBedroom * 0.3),
        high: Math.round(twoBedroom * 0.4),
      },
      source: 'api',
    };
  } catch (error) {
    console.error('Error fetching FMR from HUD:', error);
    return null;
  }
}

async function cacheFMR(sql: NeonQueryFunction<false, false>, fmr: FMRData): Promise<void> {
  try {
    await sql`
      INSERT INTO hud_fair_market_rents (
        zip_code, county_name, metro_name, fiscal_year,
        efficiency, one_bedroom, two_bedroom, three_bedroom, four_bedroom,
        created_at, updated_at
      )
      VALUES (
        ${fmr.zipCode},
        ${fmr.countyName},
        ${fmr.metroName},
        ${fmr.fiscalYear},
        ${fmr.efficiency},
        ${fmr.oneBedroom},
        ${fmr.twoBedroom},
        ${fmr.threeBedroom},
        ${fmr.fourBedroom},
        NOW(),
        NOW()
      )
      ON CONFLICT (zip_code, fiscal_year)
      DO UPDATE SET
        county_name = EXCLUDED.county_name,
        metro_name = EXCLUDED.metro_name,
        efficiency = EXCLUDED.efficiency,
        one_bedroom = EXCLUDED.one_bedroom,
        two_bedroom = EXCLUDED.two_bedroom,
        three_bedroom = EXCLUDED.three_bedroom,
        four_bedroom = EXCLUDED.four_bedroom,
        updated_at = NOW()
    `;
  } catch (error) {
    console.error('Error caching FMR:', error);
  }
}

// ============================================================================
// Address Geocoding
// ============================================================================

/**
 * Geocode an address using Mapbox Geocoding API
 *
 * @param address - Full street address (e.g., "123 Main St, San Antonio, TX 78201")
 * @returns Geocode result or null if not found
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (!mapboxToken) {
    console.warn('MAPBOX_ACCESS_TOKEN not set, skipping geocoding');
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&country=US&types=address&limit=1`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return null;
    }

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;

    // Extract context components
    let zipCode = '';
    let county = '';
    let city = '';
    let state = '';

    for (const ctx of feature.context || []) {
      if (ctx.id.startsWith('postcode')) {
        zipCode = ctx.text;
      } else if (ctx.id.startsWith('district')) {
        county = ctx.text.replace(' County', '');
      } else if (ctx.id.startsWith('place')) {
        city = ctx.text;
      } else if (ctx.id.startsWith('region')) {
        state = ctx.short_code?.replace('US-', '') || ctx.text;
      }
    }

    return {
      latitude,
      longitude,
      formattedAddress: feature.place_name,
      zipCode,
      county,
      city,
      state,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// ============================================================================
// CCN Utility Coverage
// ============================================================================

/**
 * Check CCN (Certificate of Convenience and Necessity) utility coverage
 *
 * Uses PostGIS spatial queries to determine if a location falls within
 * a CCN service area for water and/or sewer utilities.
 *
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @returns Utility coverage information
 */
export async function checkCCNCoverage(
  latitude: number,
  longitude: number
): Promise<UtilityCoverage> {
  const result: UtilityCoverage = {
    hasWater: false,
    hasSewer: false,
  };

  const sql = getSql();

  try {
    // Check water coverage
    const waterCoverage = (await sql`
      SELECT utility_name, service_type
      FROM ccn_areas
      WHERE service_type IN ('water', 'both')
        AND ST_Contains(
          boundary::geometry,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        )
      LIMIT 1
    `) as Array<{ utility_name: string; service_type: string }>;

    if (waterCoverage.length > 0 && waterCoverage[0]) {
      result.hasWater = true;
      result.waterProvider = waterCoverage[0].utility_name;
    }

    // Check sewer coverage
    const sewerCoverage = (await sql`
      SELECT utility_name, service_type
      FROM ccn_areas
      WHERE service_type IN ('sewer', 'both')
        AND ST_Contains(
          boundary::geometry,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        )
      LIMIT 1
    `) as Array<{ utility_name: string; service_type: string }>;

    if (sewerCoverage.length > 0 && sewerCoverage[0]) {
      result.hasSewer = true;
      result.sewerProvider = sewerCoverage[0].utility_name;
    }
  } catch (error) {
    // PostGIS functions may not be available or CCN data not loaded
    console.warn('CCN coverage check failed:', error);
  }

  return result;
}

// ============================================================================
// Combined Address Lookup
// ============================================================================

/**
 * Perform a complete address lookup including geocoding, utilities, and FMR
 *
 * @param address - Full street address
 * @returns Combined lookup result
 */
export async function lookupAddress(address: string): Promise<AddressLookupResult> {
  const result: AddressLookupResult = {
    geocode: null,
    utilities: { hasWater: false, hasSewer: false },
    fmr: null,
  };

  // Geocode the address
  const geocode = await geocodeAddress(address);
  if (!geocode) {
    return result;
  }
  result.geocode = geocode;

  // Check utility coverage
  result.utilities = await checkCCNCoverage(geocode.latitude, geocode.longitude);

  // Get FMR for the ZIP code
  if (geocode.zipCode) {
    result.fmr = await getFMR(geocode.zipCode);
  }

  return result;
}

// ============================================================================
// Batch Operations
// ============================================================================

/**
 * Get FMR data for multiple ZIP codes
 *
 * @param zipCodes - Array of ZIP codes
 * @returns Map of ZIP code to FMR data
 */
export async function getFMRBatch(zipCodes: string[]): Promise<Map<string, FMRData>> {
  const sql = getSql();
  const results = new Map<string, FMRData>();

  if (zipCodes.length === 0) {
    return results;
  }

  try {
    const rows = (await sql`
      SELECT DISTINCT ON (zip_code)
        zip_code,
        county_name,
        metro_name,
        fiscal_year,
        efficiency,
        one_bedroom,
        two_bedroom,
        three_bedroom,
        four_bedroom
      FROM hud_fair_market_rents
      WHERE zip_code = ANY(${zipCodes})
      ORDER BY zip_code, fiscal_year DESC
    `) as Array<Record<string, unknown>>;

    for (const row of rows) {
      const twoBedroom = row.two_bedroom ? Number(row.two_bedroom) : 0;
      results.set(row.zip_code as string, {
        zipCode: row.zip_code as string,
        countyName: row.county_name as string | null,
        metroName: row.metro_name as string | null,
        fiscalYear: Number(row.fiscal_year),
        efficiency: row.efficiency ? Number(row.efficiency) : null,
        oneBedroom: row.one_bedroom ? Number(row.one_bedroom) : null,
        twoBedroom: row.two_bedroom ? Number(row.two_bedroom) : null,
        threeBedroom: row.three_bedroom ? Number(row.three_bedroom) : null,
        fourBedroom: row.four_bedroom ? Number(row.four_bedroom) : null,
        suggestedLotRent: {
          low: Math.round(twoBedroom * 0.3),
          high: Math.round(twoBedroom * 0.4),
        },
        source: 'cache',
      });
    }
  } catch (error) {
    console.error('Error fetching FMR batch:', error);
  }

  return results;
}
