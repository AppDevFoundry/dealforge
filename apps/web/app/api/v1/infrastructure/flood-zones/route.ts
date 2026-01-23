import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getFloodZonesByBbox, getFloodZonesByCounty } from '@/lib/infrastructure/queries';
import { parseBBox } from '@dealforge/types';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for flood zones
 */
const FloodZonesQuerySchema = z
  .object({
    bbox: z.string().optional(),
    county: z.string().optional(),
    highRiskOnly: z.coerce.boolean().default(false).optional(),
  })
  .refine((data) => data.bbox || data.county, {
    message: 'Either bbox or county must be provided',
  });

/**
 * GET /api/v1/infrastructure/flood-zones - Get flood zone data
 *
 * Query params:
 * - bbox: Bounding box "minLng,minLat,maxLng,maxLat"
 * - county: Filter by county name
 * - highRiskOnly: Only return high-risk SFHA zones (default: false)
 *
 * Returns GeoJSON FeatureCollection of flood zones
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = FloodZonesQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const highRiskOnly = query.highRiskOnly ?? false;

    // Bounding box query
    if (query.bbox) {
      const bbox = parseBBox(query.bbox);
      if (!bbox) {
        return ApiErrors.validationError([
          { message: 'Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat' },
        ]);
      }

      const result = await getFloodZonesByBbox(bbox, highRiskOnly);
      return createSuccessResponse(result);
    }

    // County query
    if (query.county) {
      const result = await getFloodZonesByCounty(query.county, highRiskOnly);
      return createSuccessResponse(result);
    }

    return ApiErrors.validationError([{ message: 'Either bbox or county must be provided' }]);
  } catch (error) {
    console.error('Error fetching flood zones:', error);
    return ApiErrors.internalError('Failed to fetch flood zones');
  }
}
