import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { ccnAreasAtPoint, floodZoneAtPoint } from '@/lib/infrastructure/queries';
import type { InfrastructureSummary } from '@dealforge/types';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const QuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

/**
 * GET /api/v1/infrastructure/check-point - Check infrastructure at a point
 *
 * Query params:
 * - lat (required): Latitude
 * - lng (required): Longitude
 *
 * Returns InfrastructureSummary with CCN areas and flood zone at the point
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = QuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const { lat, lng } = queryResult.data;

    const [ccnAreas, floodZone] = await Promise.all([
      ccnAreasAtPoint(lat, lng),
      floodZoneAtPoint(lat, lng),
    ]);

    const hasWaterService = ccnAreas.some(
      (a) => a.serviceType === 'water' || a.serviceType === 'both'
    );
    const hasSewerService = ccnAreas.some(
      (a) => a.serviceType === 'sewer' || a.serviceType === 'both'
    );

    const summary: InfrastructureSummary = {
      ccnAreas,
      floodZone,
      hasWaterService,
      hasSewerService,
      floodRiskLevel: floodZone?.riskLevel ?? null,
      isHighRiskFlood: floodZone?.riskLevel === 'high',
    };

    return createSuccessResponse(summary);
  } catch (error) {
    console.error('Error checking infrastructure at point:', error);
    return ApiErrors.internalError('Failed to check infrastructure');
  }
}
