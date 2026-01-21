import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhCommunities } from '@dealforge/database/schema';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/mh-parks/[id] - Get a single MH park by ID
 */
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [park] = await db
      .select()
      .from(mhCommunities)
      .where(eq(mhCommunities.id, id))
      .limit(1);

    if (!park) {
      return ApiErrors.notFound('MH Park');
    }

    return createSuccessResponse(park);
  } catch (error) {
    console.error('Error fetching MH park:', error);
    return ApiErrors.internalError('Failed to fetch MH park');
  }
}
