import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhCommunities } from '@dealforge/database/schema';
import { type SQL, and, desc, eq, gte, isNotNull, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

const DistressedQuerySchema = z.object({
  county: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['score', 'lienCount', 'taxOwed']).default('score'),
});

/**
 * GET /api/v1/mh-parks/distressed - List distressed MH parks sorted by distress score
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = DistressedQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    const whereConditions: SQL[] = [
      isNotNull(mhCommunities.distressScore),
      gte(mhCommunities.distressScore, query.minScore),
    ];

    if (query.county) {
      whereConditions.push(eq(mhCommunities.county, query.county));
    }

    const whereClause = and(...whereConditions);

    const sortMap: Record<string, ReturnType<typeof desc>> = {
      score: desc(mhCommunities.distressScore),
      lienCount: desc(sql`(${mhCommunities.distressFactors}->>'activeLienCount')::int`),
      taxOwed: desc(sql`(${mhCommunities.distressFactors}->>'totalTaxOwed')::real`),
    };

    const orderBy = sortMap[query.sortBy]!;

    const results = await db
      .select({
        communityId: mhCommunities.id,
        name: mhCommunities.name,
        address: mhCommunities.address,
        city: mhCommunities.city,
        county: mhCommunities.county,
        lotCount: mhCommunities.lotCount,
        latitude: mhCommunities.latitude,
        longitude: mhCommunities.longitude,
        distressScore: mhCommunities.distressScore,
        distressFactors: mhCommunities.distressFactors,
        distressUpdatedAt: mhCommunities.distressUpdatedAt,
      })
      .from(mhCommunities)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(query.limit);

    return createSuccessResponse(results);
  } catch (error) {
    console.error('Error listing distressed parks:', error);
    return ApiErrors.internalError('Failed to list distressed parks');
  }
}
