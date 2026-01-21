import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhTitlings } from '@dealforge/database/schema';
import { type SQL, and, asc, eq, gte, lte } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for titling activity
 */
const TitlingActivityQuerySchema = z.object({
  county: z.string().optional(),
  startMonth: z.string().datetime().optional(),
  endMonth: z.string().datetime().optional(),
});

/**
 * GET /api/v1/mh-parks/titlings - Get titling activity data
 *
 * Query params:
 * - county: Filter by county name (optional)
 * - startMonth: Start date filter in ISO format (optional)
 * - endMonth: End date filter in ISO format (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = TitlingActivityQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    // Build where conditions
    const whereConditions: SQL[] = [];

    if (query.county) {
      whereConditions.push(eq(mhTitlings.county, query.county));
    }

    if (query.startMonth) {
      whereConditions.push(gte(mhTitlings.month, new Date(query.startMonth)));
    }

    if (query.endMonth) {
      whereConditions.push(lte(mhTitlings.month, new Date(query.endMonth)));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get titling data ordered by month
    const results = await db
      .select()
      .from(mhTitlings)
      .where(whereClause)
      .orderBy(asc(mhTitlings.month), asc(mhTitlings.county));

    // Transform to format suitable for charts
    const formattedResults = results.map((r) => ({
      id: r.id,
      county: r.county,
      month: r.month.toISOString(),
      newTitles: r.newTitles,
      transfers: r.transfers,
      totalActive: r.totalActive,
    }));

    return createSuccessResponse(formattedResults);
  } catch (error) {
    console.error('Error fetching titling activity:', error);
    return ApiErrors.internalError('Failed to fetch titling activity');
  }
}
