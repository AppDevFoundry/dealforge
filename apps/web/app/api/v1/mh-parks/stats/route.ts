import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhCommunities } from '@dealforge/database/schema';
import { type SQL, and, avg, count, eq, isNotNull, sql, sum } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for stats
 */
const StatsQuerySchema = z.object({
  county: z.string().optional(),
});

/**
 * GET /api/v1/mh-parks/stats - Get aggregate statistics
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
      whereConditions.push(eq(mhCommunities.county, query.county));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get aggregate stats
    const [aggregates] = await db
      .select({
        totalParks: count(),
        totalLots: sum(mhCommunities.lotCount),
        avgLotCount: avg(mhCommunities.lotCount),
        avgOccupancy: avg(mhCommunities.estimatedOccupancy),
        parksWithCoordinates: count(
          sql`CASE WHEN ${mhCommunities.latitude} IS NOT NULL AND ${mhCommunities.longitude} IS NOT NULL THEN 1 END`
        ),
      })
      .from(mhCommunities)
      .where(whereClause);

    // Get parks count by property type
    const parksByTypeResults = await db
      .select({
        propertyType: mhCommunities.propertyType,
        count: count(),
      })
      .from(mhCommunities)
      .where(whereClause)
      .groupBy(mhCommunities.propertyType);

    // Get distinct county count
    const [countyCountResult] = await db
      .select({
        countyCount: count(sql`DISTINCT ${mhCommunities.county}`),
      })
      .from(mhCommunities)
      .where(whereClause);

    // Transform to typed object
    const parksByType = {
      all_ages: 0,
      'senior_55+': 0,
      family: 0,
      unknown: 0,
    };

    for (const row of parksByTypeResults) {
      if (row.propertyType === 'all_ages') {
        parksByType.all_ages = row.count;
      } else if (row.propertyType === 'senior_55+') {
        parksByType['senior_55+'] = row.count;
      } else if (row.propertyType === 'family') {
        parksByType.family = row.count;
      } else {
        parksByType.unknown = row.count;
      }
    }

    const stats = {
      totalParks: aggregates?.totalParks ?? 0,
      totalLots: Number(aggregates?.totalLots) || 0,
      avgLotCount: Math.round(Number(aggregates?.avgLotCount) || 0),
      avgOccupancy: aggregates?.avgOccupancy ? Number(aggregates.avgOccupancy) : null,
      parksWithCoordinates: aggregates?.parksWithCoordinates ?? 0,
      countyCount: countyCountResult?.countyCount ?? 0,
      parksByType,
    };

    return createSuccessResponse(stats);
  } catch (error) {
    console.error('Error fetching MH park stats:', error);
    return ApiErrors.internalError('Failed to fetch MH park stats');
  }
}
