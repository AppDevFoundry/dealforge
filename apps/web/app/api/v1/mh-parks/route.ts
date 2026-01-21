import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhCommunities } from '@dealforge/database/schema';
import { type SQL, and, asc, count, desc, eq, gte, lte } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for listing MH parks
 */
const ListMhParksQuerySchema = z.object({
  county: z.string().optional(),
  city: z.string().optional(),
  minLots: z.coerce.number().int().min(0).optional(),
  maxLots: z.coerce.number().int().min(0).optional(),
  propertyType: z.enum(['all_ages', 'senior_55+', 'family']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(1000).default(20),
  sortBy: z.enum(['name', 'lotCount', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * GET /api/v1/mh-parks - List MH parks with filtering and pagination
 *
 * Query params:
 * - county: Filter by county name
 * - city: Filter by city
 * - minLots: Minimum lot count
 * - maxLots: Maximum lot count
 * - propertyType: Filter by property type (all_ages, senior_55+, family)
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 20, max: 100)
 * - sortBy: Sort field (name, lotCount, createdAt, updatedAt)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = ListMhParksQuerySchema.safeParse(Object.fromEntries(searchParams));

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

    if (query.city) {
      whereConditions.push(eq(mhCommunities.city, query.city));
    }

    if (query.propertyType) {
      whereConditions.push(eq(mhCommunities.propertyType, query.propertyType));
    }

    if (query.minLots !== undefined) {
      whereConditions.push(gte(mhCommunities.lotCount, query.minLots));
    }

    if (query.maxLots !== undefined) {
      whereConditions.push(lte(mhCommunities.lotCount, query.maxLots));
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
      createdAt: mhCommunities.createdAt,
      updatedAt: mhCommunities.updatedAt,
    };

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
    console.error('Error listing MH parks:', error);
    return ApiErrors.internalError('Failed to list MH parks');
  }
}
