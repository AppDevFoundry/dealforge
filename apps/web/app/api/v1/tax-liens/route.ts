import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhCommunities, mhTaxLiens } from '@dealforge/database/schema';
import { type SQL, and, asc, count, desc, eq, gte, lte } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for listing tax liens
 */
const ListTaxLiensQuerySchema = z.object({
  county: z.string().optional(),
  status: z.enum(['active', 'released']).optional(),
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  communityId: z.string().optional(),
  minAmount: z.coerce.number().min(0).optional(),
  maxAmount: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(1000).default(20),
  sortBy: z.enum(['amount', 'year', 'filedDate', 'county']).default('filedDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/v1/tax-liens - List tax liens with filtering and pagination
 *
 * Query params:
 * - county: Filter by county name
 * - status: Filter by status (active, released)
 * - year: Filter by tax year
 * - communityId: Filter by linked community
 * - minAmount: Minimum lien amount
 * - maxAmount: Maximum lien amount
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 20, max: 1000)
 * - sortBy: Sort field (amount, year, filedDate, county)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = ListTaxLiensQuerySchema.safeParse(Object.fromEntries(searchParams));

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

    if (query.status) {
      whereConditions.push(eq(mhTaxLiens.status, query.status));
    }

    if (query.year) {
      whereConditions.push(eq(mhTaxLiens.year, query.year));
    }

    if (query.communityId) {
      whereConditions.push(eq(mhTaxLiens.communityId, query.communityId));
    }

    if (query.minAmount !== undefined) {
      whereConditions.push(gte(mhTaxLiens.amount, query.minAmount));
    }

    if (query.maxAmount !== undefined) {
      whereConditions.push(lte(mhTaxLiens.amount, query.maxAmount));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const [countResult] = await db.select({ total: count() }).from(mhTaxLiens).where(whereClause);

    const total = countResult?.total ?? 0;

    // Build sort order
    const sortColumnMap = {
      amount: mhTaxLiens.amount,
      year: mhTaxLiens.year,
      filedDate: mhTaxLiens.filedDate,
      county: mhTaxLiens.county,
    };

    const sortColumn = sortColumnMap[query.sortBy];
    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get paginated results with community join
    const results = await db
      .select({
        id: mhTaxLiens.id,
        serialNumber: mhTaxLiens.serialNumber,
        hudLabel: mhTaxLiens.hudLabel,
        county: mhTaxLiens.county,
        taxingEntity: mhTaxLiens.taxingEntity,
        amount: mhTaxLiens.amount,
        year: mhTaxLiens.year,
        status: mhTaxLiens.status,
        filedDate: mhTaxLiens.filedDate,
        releasedDate: mhTaxLiens.releasedDate,
        communityId: mhTaxLiens.communityId,
        sourceUpdatedAt: mhTaxLiens.sourceUpdatedAt,
        createdAt: mhTaxLiens.createdAt,
        community: {
          id: mhCommunities.id,
          name: mhCommunities.name,
          city: mhCommunities.city,
        },
      })
      .from(mhTaxLiens)
      .leftJoin(mhCommunities, eq(mhTaxLiens.communityId, mhCommunities.id))
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
    console.error('Error listing tax liens:', error);
    return ApiErrors.internalError('Failed to list tax liens');
  }
}
