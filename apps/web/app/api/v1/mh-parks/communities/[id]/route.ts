import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhCommunities } from '@dealforge/database/schema';
import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const db = getDb();

    const [community] = await db
      .select()
      .from(mhCommunities)
      .where(eq(mhCommunities.id, id))
      .limit(1);

    if (!community) {
      return ApiErrors.notFound('MH Community');
    }

    return createSuccessResponse(community);
  } catch (error) {
    console.error('Error fetching MH community:', error);
    return ApiErrors.internalError('Failed to fetch MH community');
  }
}
