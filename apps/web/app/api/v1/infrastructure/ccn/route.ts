import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getCcnAreasByBbox, getCcnAreasNearPoint } from '@/lib/infrastructure/queries';
import type { CcnServiceType } from '@dealforge/types';
import { parseBBox } from '@dealforge/types';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for CCN areas
 */
const CcnQuerySchema = z
  .object({
    bbox: z.string().optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().min(0).max(50000).default(5000).optional(),
    serviceType: z.enum(['water', 'sewer', 'both']).optional(),
  })
  .refine((data) => data.bbox || (data.lat !== undefined && data.lng !== undefined), {
    message: 'Either bbox or lat/lng must be provided',
  });

/**
 * GET /api/v1/infrastructure/ccn - Get CCN utility areas
 *
 * Query params:
 * - bbox: Bounding box "minLng,minLat,maxLng,maxLat"
 * - lat/lng: Point coordinates for radius search
 * - radius: Search radius in meters (default: 5000, max: 50000)
 * - serviceType: Filter by service type (water, sewer, both)
 *
 * Returns GeoJSON FeatureCollection of CCN areas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = CcnQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const serviceType = query.serviceType as CcnServiceType | undefined;

    // Bounding box query
    if (query.bbox) {
      const bbox = parseBBox(query.bbox);
      if (!bbox) {
        return ApiErrors.validationError([
          { message: 'Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat' },
        ]);
      }

      const result = await getCcnAreasByBbox(bbox, serviceType);
      return createSuccessResponse(result);
    }

    // Point + radius query
    if (query.lat !== undefined && query.lng !== undefined) {
      const result = await getCcnAreasNearPoint(
        query.lat,
        query.lng,
        query.radius ?? 5000,
        serviceType
      );
      return createSuccessResponse(result);
    }

    return ApiErrors.validationError([{ message: 'Either bbox or lat/lng must be provided' }]);
  } catch (error) {
    console.error('Error fetching CCN areas:', error);
    return ApiErrors.internalError('Failed to fetch CCN areas');
  }
}
