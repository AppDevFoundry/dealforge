import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getInfrastructureAtPoint } from '@/lib/infrastructure/queries';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for point check
 */
const PointCheckQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * GET /api/v1/infrastructure/check-point - Check infrastructure at a point
 *
 * Query params:
 * - lat: Latitude
 * - lng: Longitude
 *
 * Returns infrastructure data (CCN areas and flood zones) containing the point
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = PointCheckQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const { lat, lng } = queryResult.data;
    const result = await getInfrastructureAtPoint(lat, lng);

    // Add summary information
    const summary = {
      hasWaterService: result.ccnAreas.some(
        (a) => a.serviceType === 'water' || a.serviceType === 'both'
      ),
      hasSewerService: result.ccnAreas.some(
        (a) => a.serviceType === 'sewer' || a.serviceType === 'both'
      ),
      highestFloodRisk:
        result.floodZones.length > 0
          ? result.floodZones.reduce(
              (highest, zone) => {
                const riskOrder = { high: 3, moderate: 2, low: 1, undetermined: 0 };
                return riskOrder[zone.riskLevel] > riskOrder[highest] ? zone.riskLevel : highest;
              },
              'undetermined' as 'high' | 'moderate' | 'low' | 'undetermined'
            )
          : null,
      ccnCount: result.ccnAreas.length,
      floodZoneCount: result.floodZones.length,
    };

    return createSuccessResponse({
      ...result,
      summary,
    });
  } catch (error) {
    console.error('Error checking infrastructure at point:', error);
    return ApiErrors.internalError('Failed to check infrastructure');
  }
}
