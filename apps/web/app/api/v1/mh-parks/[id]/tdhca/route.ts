import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getTaxLienSummaryForPark, getTitleActivityForPark } from '@/lib/tdhca/queries';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/mh-parks/[id]/tdhca - Get TDHCA data (lien summary + title activity) for a park
 */
export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    const [lienSummary, titleActivity] = await Promise.all([
      getTaxLienSummaryForPark(id),
      getTitleActivityForPark(id),
    ]);

    return createSuccessResponse({ lienSummary, titleActivity });
  } catch (error) {
    console.error('Error fetching TDHCA data:', error);
    return ApiErrors.internalError('Failed to fetch TDHCA data');
  }
}
