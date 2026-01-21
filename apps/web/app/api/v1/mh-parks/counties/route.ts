import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { texasCounties } from '@dealforge/database/schema';
import { asc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for listing counties
 */
const ListCountiesQuerySchema = z.object({
  activeOnly: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

/**
 * GET /api/v1/mh-parks/counties - List Texas counties
 *
 * Query params:
 * - activeOnly: Only return active counties (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = ListCountiesQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    // Build query
    const whereClause = query.activeOnly ? eq(texasCounties.isActive, true) : undefined;

    const results = await db
      .select()
      .from(texasCounties)
      .where(whereClause)
      .orderBy(asc(texasCounties.name));

    return createSuccessResponse(results);
  } catch (error) {
    console.error('Error listing counties:', error);
    return ApiErrors.internalError('Failed to list counties');
  }
}
