import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import { getDb } from '@dealforge/database/client';
import { deals } from '@dealforge/database/schema';
import { CreateDealSchema, ListDealsQuerySchema } from '@dealforge/types';
import { type SQL, and, asc, count, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/v1/deals - List user's deals
 *
 * Query params:
 * - type: Filter by deal type (rental, brrrr, etc.)
 * - status: Filter by status (draft, analyzing, archived)
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 20, max: 100)
 * - sortBy: Sort field (createdAt, updatedAt, name)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const queryResult = ListDealsQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    // Build where conditions
    const whereConditions: SQL[] = [eq(deals.userId, session.user.id)];
    if (query.type) whereConditions.push(eq(deals.type, query.type));
    if (query.status) whereConditions.push(eq(deals.status, query.status));

    const whereClause = and(...whereConditions);

    // Get total count
    const [countResult] = await db.select({ total: count() }).from(deals).where(whereClause);

    const total = countResult?.total ?? 0;

    // Build sort order
    const sortColumn = deals[query.sortBy];
    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    // Get paginated results
    const results = await db
      .select()
      .from(deals)
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
    console.error('Error listing deals:', error);
    return ApiErrors.internalError('Failed to list deals');
  }
}

/**
 * POST /api/v1/deals - Create a new deal
 *
 * Body:
 * - type: Deal type (required)
 * - name: Deal name (required)
 * - address: Property address (optional)
 * - inputs: Calculator inputs (required)
 * - results: Calculation results (optional)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const parseResult = CreateDealSchema.safeParse(body);

    if (!parseResult.success) {
      return ApiErrors.validationError(parseResult.error.errors);
    }

    const data = parseResult.data;
    const db = getDb();

    const [newDeal] = await db
      .insert(deals)
      .values({
        userId: session.user.id,
        type: data.type,
        name: data.name,
        address: data.address ?? null,
        inputs: data.inputs,
        results: data.results ?? null,
      })
      .returning();

    return createSuccessResponse(newDeal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validationError(error.errors);
    }
    console.error('Error creating deal:', error);
    return ApiErrors.internalError('Failed to create deal');
  }
}
