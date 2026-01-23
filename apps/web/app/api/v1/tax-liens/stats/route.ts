import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhTaxLiens } from '@dealforge/database/schema';
import { type SQL, and, avg, count, eq, sql, sum } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for stats
 */
const StatsQuerySchema = z.object({
  county: z.string().optional(),
});

/**
 * GET /api/v1/tax-liens/stats - Get aggregate statistics
 *
 * Query params:
 * - county: Filter by county name (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = StatsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    // Build where conditions
    const whereConditions: SQL[] = [];

    if (query.county) {
      whereConditions.push(eq(mhTaxLiens.county, query.county));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get aggregate stats for active liens
    const [activeStats] = await db
      .select({
        totalActive: count(),
        totalAmount: sum(mhTaxLiens.amount),
        avgAmount: avg(mhTaxLiens.amount),
      })
      .from(mhTaxLiens)
      .where(
        whereClause
          ? and(whereClause, eq(mhTaxLiens.status, 'active'))
          : eq(mhTaxLiens.status, 'active')
      );

    // Get total released count
    const [releasedStats] = await db
      .select({
        totalReleased: count(),
      })
      .from(mhTaxLiens)
      .where(
        whereClause
          ? and(whereClause, eq(mhTaxLiens.status, 'released'))
          : eq(mhTaxLiens.status, 'released')
      );

    // Get stats by county (for active liens only)
    const byCountyResults = await db
      .select({
        county: mhTaxLiens.county,
        count: count(),
        amount: sql<number>`COALESCE(SUM(${mhTaxLiens.amount}), 0)`.as('amount'),
      })
      .from(mhTaxLiens)
      .where(
        whereClause
          ? and(whereClause, eq(mhTaxLiens.status, 'active'))
          : eq(mhTaxLiens.status, 'active')
      )
      .groupBy(mhTaxLiens.county)
      .orderBy(sql`count DESC`);

    // Get stats by year (for active liens only)
    const byYearResults = await db
      .select({
        year: mhTaxLiens.year,
        count: count(),
      })
      .from(mhTaxLiens)
      .where(
        whereClause
          ? and(whereClause, eq(mhTaxLiens.status, 'active'))
          : eq(mhTaxLiens.status, 'active')
      )
      .groupBy(mhTaxLiens.year)
      .orderBy(sql`${mhTaxLiens.year} DESC`);

    const stats = {
      totalActive: activeStats?.totalActive ?? 0,
      totalReleased: releasedStats?.totalReleased ?? 0,
      totalAmount: Number(activeStats?.totalAmount) || 0,
      avgAmount: Math.round(Number(activeStats?.avgAmount) || 0),
      byCounty: byCountyResults.map((row) => ({
        county: row.county,
        count: row.count,
        amount: Number(row.amount),
      })),
      byYear: byYearResults
        .filter((row) => row.year !== null)
        .map((row) => ({
          year: row.year!,
          count: row.count,
        })),
    };

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error fetching tax lien stats:', error);
    return ApiErrors.internalError('Failed to fetch tax lien stats');
  }
}
