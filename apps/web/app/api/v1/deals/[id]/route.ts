import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import { getDb } from '@dealforge/database/client';
import { deals } from '@dealforge/database/schema';
import { UpdateDealSchema } from '@dealforge/types';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/v1/deals/:id - Get a single deal
 *
 * Returns 404 if deal not found or doesn't belong to user.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

    const [deal] = await db
      .select()
      .from(deals)
      .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
      .limit(1);

    if (!deal) {
      return ApiErrors.notFound('Deal');
    }

    return createSuccessResponse(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    return ApiErrors.internalError('Failed to fetch deal');
  }
}

/**
 * PUT /api/v1/deals/:id - Update a deal
 *
 * Body (all optional):
 * - name: Deal name
 * - status: Deal status
 * - address: Property address
 * - inputs: Calculator inputs
 * - results: Calculation results
 * - isPublic: Public sharing flag
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

    // Verify ownership first
    const [existingDeal] = await db
      .select({ id: deals.id })
      .from(deals)
      .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
      .limit(1);

    if (!existingDeal) {
      return ApiErrors.notFound('Deal');
    }

    const body = await request.json();
    const parseResult = UpdateDealSchema.safeParse(body);

    if (!parseResult.success) {
      return ApiErrors.validationError(parseResult.error.errors);
    }

    const data = parseResult.data;

    const [updatedDeal] = await db
      .update(deals)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(deals.id, id))
      .returning();

    return createSuccessResponse(updatedDeal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validationError(error.errors);
    }
    console.error('Error updating deal:', error);
    return ApiErrors.internalError('Failed to update deal');
  }
}

/**
 * DELETE /api/v1/deals/:id - Delete a deal
 *
 * Returns 404 if deal not found or doesn't belong to user.
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

    // Delete and return the deleted deal (verifies ownership in one query)
    const [deletedDeal] = await db
      .delete(deals)
      .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
      .returning({ id: deals.id });

    if (!deletedDeal) {
      return ApiErrors.notFound('Deal');
    }

    return createSuccessResponse({ id: deletedDeal.id, deleted: true });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return ApiErrors.internalError('Failed to delete deal');
  }
}
