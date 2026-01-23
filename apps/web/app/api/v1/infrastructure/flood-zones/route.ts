import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { floodZonesInBbox, parseBbox } from '@/lib/infrastructure/queries';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  bbox: z.string().min(1),
  county: z.string().optional(),
  highRiskOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

/**
 * GET /api/v1/infrastructure/flood-zones - Get flood zones within bbox
 *
 * Query params:
 * - bbox (required): 'minLng,minLat,maxLng,maxLat'
 * - county (optional): Filter by county name
 * - highRiskOnly (optional): 'true' to only return high-risk zones
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

    const { bbox, county, highRiskOnly } = queryResult.data;
    const parsed = parseBbox(bbox);

    if (!parsed) {
      return ApiErrors.validationError([
        { path: ['bbox'], message: 'Invalid bbox format. Expected: minLng,minLat,maxLng,maxLat' },
      ]);
    }

    const [minLng, minLat, maxLng, maxLat] = parsed;
    const data = await floodZonesInBbox(minLng, minLat, maxLng, maxLat, {
      county,
      highRiskOnly,
    });

    const response = createSuccessResponse(data);
    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
  } catch (error) {
    console.error('Error fetching flood zones:', error);
    return ApiErrors.internalError('Failed to fetch flood zones');
  }
}
