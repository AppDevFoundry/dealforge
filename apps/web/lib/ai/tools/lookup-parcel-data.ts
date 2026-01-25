/**
 * Lookup Parcel Data Tool
 *
 * Performs JIT (just-in-time) lookup for a property address including
 * geocoding, CCN utility coverage check, and nearby park discovery.
 */

import { neon } from '@neondatabase/serverless';
import { tool } from 'ai';
import { z } from 'zod';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

const lookupParcelDataSchema = z.object({
  address: z
    .string()
    .optional()
    .describe('Full street address to geocode (e.g., "123 Main St, San Antonio, TX 78201")'),
  zipCode: z
    .string()
    .optional()
    .describe('ZIP code for the location'),
  latitude: z
    .number()
    .optional()
    .describe('Latitude coordinate if already known'),
  longitude: z
    .number()
    .optional()
    .describe('Longitude coordinate if already known'),
  searchRadiusMiles: z
    .number()
    .default(10)
    .describe('Radius in miles to search for nearby parks (default: 10)'),
});

type LookupParcelDataParams = z.infer<typeof lookupParcelDataSchema>;

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  zipCode: string;
  county?: string;
  city?: string;
}

interface UtilityCoverage {
  hasWater: boolean;
  hasSewer: boolean;
  waterProvider?: string;
  sewerProvider?: string;
}

interface NearbyPark {
  id: string;
  name: string;
  address: string;
  city: string;
  distanceMiles: number;
  lotCount: number | null;
  distressScore: number | null;
}

export interface ParcelDataResult {
  location: {
    coordinates?: { latitude: number; longitude: number };
    formattedAddress?: string;
    zipCode?: string;
    county?: string;
    city?: string;
  };
  utilities: UtilityCoverage;
  marketRents?: {
    fiscalYear: number;
    twoBedroom: number | null;
    suggestedLotRent: { low: number; high: number };
  };
  nearbyParks: NearbyPark[];
  insights: string[];
}

export const lookupParcelData = tool({
  description:
    'Look up property/parcel data for an address or coordinates. Returns geocoded location, CCN utility coverage (water/sewer), FMR-based rent estimates, and nearby MH parks within the search radius.',
  inputSchema: lookupParcelDataSchema,
  execute: async (params: LookupParcelDataParams): Promise<ParcelDataResult> => {
    const { address, zipCode, latitude, longitude, searchRadiusMiles } = params;
    const sql = getSql();

    const result: ParcelDataResult = {
      location: {},
      utilities: { hasWater: false, hasSewer: false },
      nearbyParks: [],
      insights: [],
    };

    let coords: { lat: number; lng: number } | null = null;
    let resolvedZip = zipCode;

    // Geocode address if provided and no coordinates
    if (address && !latitude && !longitude) {
      const geocoded = await geocodeAddress(address);
      if (geocoded) {
        coords = { lat: geocoded.latitude, lng: geocoded.longitude };
        resolvedZip = geocoded.zipCode;
        result.location = {
          coordinates: { latitude: geocoded.latitude, longitude: geocoded.longitude },
          formattedAddress: geocoded.formattedAddress,
          zipCode: geocoded.zipCode,
          county: geocoded.county,
          city: geocoded.city,
        };
      }
    } else if (latitude && longitude) {
      coords = { lat: latitude, lng: longitude };
      result.location.coordinates = { latitude, longitude };
      if (zipCode) {
        result.location.zipCode = zipCode;
      }
    }

    // Check CCN utility coverage if we have coordinates
    if (coords) {
      const utilityCoverage = await checkCCNCoverage(coords.lat, coords.lng);
      result.utilities = utilityCoverage;

      if (!utilityCoverage.hasWater && !utilityCoverage.hasSewer) {
        result.insights.push(
          'No CCN utility coverage detected - property may require well/septic or private utility extension'
        );
      } else if (utilityCoverage.hasWater && utilityCoverage.hasSewer) {
        result.insights.push(
          `Full utility coverage: Water (${utilityCoverage.waterProvider}), Sewer (${utilityCoverage.sewerProvider})`
        );
      } else if (utilityCoverage.hasWater) {
        result.insights.push(
          `Water service available (${utilityCoverage.waterProvider}) but no sewer CCN - may need septic`
        );
      } else if (utilityCoverage.hasSewer) {
        result.insights.push(
          `Sewer service available (${utilityCoverage.sewerProvider}) but no water CCN - unusual, verify`
        );
      }
    }

    // Fetch FMR for the ZIP code
    if (resolvedZip) {
      const fmrRows = (await sql`
        SELECT fiscal_year, two_bedroom, county_name
        FROM hud_fair_market_rents
        WHERE zip_code = ${resolvedZip}
        ORDER BY fiscal_year DESC
        LIMIT 1
      `) as Array<Record<string, unknown>>;

      const fmr = fmrRows[0];
      if (fmr) {
        const twoBedroom = Number(fmr.two_bedroom) || 0;
        result.marketRents = {
          fiscalYear: Number(fmr.fiscal_year),
          twoBedroom: fmr.two_bedroom ? Number(fmr.two_bedroom) : null,
          suggestedLotRent: {
            low: Math.round(twoBedroom * 0.3),
            high: Math.round(twoBedroom * 0.4),
          },
        };

        if (!result.location.county && fmr.county_name) {
          result.location.county = fmr.county_name as string;
        }

        result.insights.push(
          `FMR-based lot rent estimate: $${result.marketRents.suggestedLotRent.low}-$${result.marketRents.suggestedLotRent.high}/month`
        );
      }
    }

    // Find nearby MH parks
    if (coords) {
      const radiusMeters = searchRadiusMiles * 1609.34;
      const nearbyParks = await sql`
        SELECT
          id,
          name,
          address,
          city,
          lot_count,
          distress_score,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
          ) / 1609.34 as distance_miles
        FROM mh_communities
        WHERE latitude IS NOT NULL
          AND longitude IS NOT NULL
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)::geography,
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ${radiusMeters}
          )
        ORDER BY distance_miles
        LIMIT 10
      `;

      result.nearbyParks = nearbyParks.map((park) => ({
        id: park.id as string,
        name: park.name as string,
        address: park.address as string,
        city: park.city as string,
        distanceMiles: Math.round((park.distance_miles as number) * 10) / 10,
        lotCount: park.lot_count ? Number(park.lot_count) : null,
        distressScore: park.distress_score ? Number(park.distress_score) : null,
      }));

      if (result.nearbyParks.length > 0) {
        const avgDistress =
          result.nearbyParks
            .filter((p) => p.distressScore !== null)
            .reduce((sum, p) => sum + (p.distressScore || 0), 0) /
          result.nearbyParks.filter((p) => p.distressScore !== null).length;

        result.insights.push(
          `Found ${result.nearbyParks.length} MH parks within ${searchRadiusMiles} miles (avg distress score: ${avgDistress.toFixed(1)})`
        );

        const distressedNearby = result.nearbyParks.filter(
          (p) => p.distressScore !== null && p.distressScore >= 50
        );
        if (distressedNearby.length > 0) {
          result.insights.push(
            `${distressedNearby.length} nearby park(s) showing distress signals - potential acquisition targets`
          );
        }
      } else {
        result.insights.push(`No MH parks found within ${searchRadiusMiles} miles`);
      }
    }

    return result;
  },
});

/**
 * Geocode an address using Mapbox Geocoding API
 */
async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
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

    for (const ctx of feature.context || []) {
      if (ctx.id.startsWith('postcode')) {
        zipCode = ctx.text;
      } else if (ctx.id.startsWith('district')) {
        county = ctx.text.replace(' County', '');
      } else if (ctx.id.startsWith('place')) {
        city = ctx.text;
      }
    }

    return {
      latitude,
      longitude,
      formattedAddress: feature.place_name,
      zipCode,
      county,
      city,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Check CCN (Certificate of Convenience and Necessity) utility coverage
 */
async function checkCCNCoverage(
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

    if (waterCoverage.length > 0) {
      result.hasWater = true;
      result.waterProvider = waterCoverage[0]!.utility_name;
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

    if (sewerCoverage.length > 0) {
      result.hasSewer = true;
      result.sewerProvider = sewerCoverage[0]!.utility_name;
    }
  } catch (error) {
    // PostGIS functions may not be available or CCN data not loaded
    console.warn('CCN coverage check failed:', error);
  }

  return result;
}
