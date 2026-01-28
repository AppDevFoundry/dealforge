/**
 * Lookup Parcel Data Tool
 *
 * Performs JIT (just-in-time) lookup for a property address including
 * geocoding, CCN utility coverage check, and nearby park discovery.
 */

import { checkCCNCoverage } from '@/lib/shared/ccn-coverage';
import { calculateSuggestedLotRent, lookupFmr } from '@/lib/shared/fmr-lookup';
import { geocodeAddress } from '@/lib/shared/geocoding';
import { findNearbyParks, getNearbyParksInsights } from '@/lib/shared/nearby-parks';
import { tool } from 'ai';
import { z } from 'zod';

const lookupParcelDataSchema = z.object({
  address: z
    .string()
    .optional()
    .describe('Full street address to geocode (e.g., "123 Main St, San Antonio, TX 78201")'),
  zipCode: z.string().optional().describe('ZIP code for the location'),
  latitude: z.number().optional().describe('Latitude coordinate if already known'),
  longitude: z.number().optional().describe('Longitude coordinate if already known'),
  searchRadiusMiles: z
    .number()
    .default(10)
    .describe('Radius in miles to search for nearby parks (default: 10)'),
});

type LookupParcelDataParams = z.infer<typeof lookupParcelDataSchema>;

interface NearbyPark {
  id: string;
  name: string;
  address: string | null;
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
  utilities: {
    hasWater: boolean;
    hasSewer: boolean;
    waterProvider?: string;
    sewerProvider?: string;
  };
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
      result.utilities = {
        hasWater: utilityCoverage.hasWater,
        hasSewer: utilityCoverage.hasSewer,
        waterProvider: utilityCoverage.waterProvider?.utilityName,
        sewerProvider: utilityCoverage.sewerProvider?.utilityName,
      };

      if (!utilityCoverage.hasWater && !utilityCoverage.hasSewer) {
        result.insights.push(
          'No CCN utility coverage detected - property may require well/septic or private utility extension'
        );
      } else if (utilityCoverage.hasWater && utilityCoverage.hasSewer) {
        result.insights.push(
          `Full utility coverage: Water (${result.utilities.waterProvider}), Sewer (${result.utilities.sewerProvider})`
        );
      } else if (utilityCoverage.hasWater) {
        result.insights.push(
          `Water service available (${result.utilities.waterProvider}) but no sewer CCN - may need septic`
        );
      } else if (utilityCoverage.hasSewer) {
        result.insights.push(
          `Sewer service available (${result.utilities.sewerProvider}) but no water CCN - unusual, verify`
        );
      }
    }

    // Fetch FMR for the ZIP code
    if (resolvedZip) {
      const fmr = await lookupFmr(resolvedZip);
      if (fmr) {
        const suggestedRent = calculateSuggestedLotRent(fmr);
        if (suggestedRent) {
          result.marketRents = {
            fiscalYear: fmr.year,
            twoBedroom: fmr.twoBr ?? null,
            suggestedLotRent: suggestedRent,
          };

          if (!result.location.county && fmr.countyName) {
            result.location.county = fmr.countyName;
          }

          result.insights.push(
            `FMR-based lot rent estimate: $${suggestedRent.low}-$${suggestedRent.high}/month`
          );
        }
      }
    }

    // Find nearby MH parks
    if (coords) {
      const nearbyParks = await findNearbyParks(coords.lat, coords.lng, searchRadiusMiles, 10);

      result.nearbyParks = nearbyParks.map((park) => ({
        id: park.id,
        name: park.name,
        address: park.address ?? null,
        city: park.city,
        distanceMiles: park.distanceMiles,
        lotCount: park.lotCount ?? null,
        distressScore: park.distressScore ?? null,
      }));

      const parkInsights = getNearbyParksInsights(nearbyParks, searchRadiusMiles);
      result.insights.push(...parkInsights);
    }

    return result;
  },
});
