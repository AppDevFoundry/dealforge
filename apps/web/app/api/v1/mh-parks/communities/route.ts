import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhCommunities } from '@dealforge/database/schema';
import { ListMhCommunitiesQuerySchema } from '@dealforge/types';
import { type SQL, and, asc, count, desc, eq, gte, ilike, lte, or } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = ListMhCommunitiesQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    // Build WHERE conditions
    const whereConditions: SQL[] = [];

    if (query.county) {
      whereConditions.push(eq(mhCommunities.county, query.county));
    }
    if (query.city) {
      whereConditions.push(eq(mhCommunities.city, query.city));
    }
    if (query.propertyType) {
      whereConditions.push(eq(mhCommunities.propertyType, query.propertyType));
    }
    if (query.lotCountMin !== undefined) {
      whereConditions.push(gte(mhCommunities.lotCount, query.lotCountMin));
    }
    if (query.lotCountMax !== undefined) {
      whereConditions.push(lte(mhCommunities.lotCount, query.lotCountMax));
    }
    if (query.search) {
      whereConditions.push(
        or(
          ilike(mhCommunities.name, `%${query.search}%`),
          ilike(mhCommunities.city, `%${query.search}%`),
          ilike(mhCommunities.county, `%${query.search}%`)
        )!
      );
    }

    // Map viewport bounds
    if (
      query.swLat !== undefined &&
      query.swLng !== undefined &&
      query.neLat !== undefined &&
      query.neLng !== undefined
    ) {
      whereConditions.push(gte(mhCommunities.latitude, query.swLat));
      whereConditions.push(lte(mhCommunities.latitude, query.neLat));
      whereConditions.push(gte(mhCommunities.longitude, query.swLng));
      whereConditions.push(lte(mhCommunities.longitude, query.neLng));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [countResult] = await db
      .select({ total: count() })
      .from(mhCommunities)
      .where(whereClause);
    const total = countResult?.total ?? 0;

    // Build sort order
    const sortColumnMap = {
      name: mhCommunities.name,
      lotCount: mhCommunities.lotCount,
      county: mhCommunities.county,
      city: mhCommunities.city,
      createdAt: mhCommunities.createdAt,
    } as const;
    const sortColumn = sortColumnMap[query.sortBy];
    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get paginated results
    const results = await db
      .select()
      .from(mhCommunities)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(query.perPage)
      .offset((query.page - 1) * query.perPage);

    return createSuccessResponse(results, {
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
      },
    });
  } catch (error) {
    console.error('Error listing MH communities:', error);
    return ApiErrors.internalError('Failed to list MH communities');
  }
}
