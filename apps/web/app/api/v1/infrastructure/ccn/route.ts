import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { ccnAreasInBbox, parseBbox } from '@/lib/infrastructure/queries';
import type { CcnServiceType } from '@dealforge/types';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  bbox: z.string().min(1),
  serviceType: z.enum(['water', 'sewer', 'both']).optional(),
});

/**
 * GET /api/v1/infrastructure/ccn - Get CCN service areas within bbox
 *
 * Query params:
 * - bbox (required): 'minLng,minLat,maxLng,maxLat'
 * - serviceType (optional): 'water', 'sewer', or 'both'
 *
 * Returns GeoJSON FeatureCollection
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = QuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const { bbox, serviceType } = queryResult.data;
    const parsed = parseBbox(bbox);

    if (!parsed) {
      return ApiErrors.validationError([
        { path: ['bbox'], message: 'Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat' },
      ]);
    }

    const [minLng, minLat, maxLng, maxLat] = parsed;
    const data = await ccnAreasInBbox(
      minLng,
      minLat,
      maxLng,
      maxLat,
      serviceType as CcnServiceType | undefined
    );

    const response = createSuccessResponse(data);
    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
  } catch (error) {
    console.error('Error fetching CCN areas:', error);
    return ApiErrors.internalError('Failed to fetch CCN areas');
  }
}
