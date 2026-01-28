import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import { getDb } from '@dealforge/database/client';
import { leadIntelligence, leads } from '@dealforge/database/schema';
import { UpdateLeadSchema } from '@dealforge/types';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

type RouteParams = { params: Promise<{ leadId: string }> };

/**
 * GET /api/v1/leads/:leadId - Get a single lead with intelligence
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

    // Get lead with intelligence joined
    const results = await db
      .select({
        lead: leads,
        intelligence: leadIntelligence,
      })
      .from(leads)
      .leftJoin(leadIntelligence, eq(leads.id, leadIntelligence.leadId))
      .where(and(eq(leads.id, leadId), eq(leads.userId, session.user.id)))
      .limit(1);

    const result = results[0];
    if (!result) {
      return ApiErrors.notFound('Lead');
    }

    // Combine lead and intelligence into response
    const response = {
      ...result.lead,
      intelligence: result.intelligence,
    };

    return createSuccessResponse(response);
  } catch (error) {
    console.error('Error fetching lead:', error);
    return ApiErrors.internalError('Failed to fetch lead');
  }
}

/**
 * PATCH /api/v1/leads/:leadId - Update a lead
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

    // Verify ownership first
    const [existingLead] = await db
      .select({ id: leads.id })
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, session.user.id)))
      .limit(1);

    if (!existingLead) {
      return ApiErrors.notFound('Lead');
    }

    const body = await request.json();
    const parseResult = UpdateLeadSchema.safeParse(body);

    if (!parseResult.success) {
      return ApiErrors.validationError(parseResult.error.errors);
    }

    const data = parseResult.data;

    // Build update object, filtering out undefined values
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    const [updatedLead] = await db
      .update(leads)
      .set(updateData)
      .where(eq(leads.id, leadId))
      .returning();

    return createSuccessResponse(updatedLead);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return ApiErrors.validationError(error.errors);
    }
    console.error('Error updating lead:', error);
    return ApiErrors.internalError('Failed to update lead');
  }
}

/**
 * DELETE /api/v1/leads/:leadId - Delete a lead
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

    // Delete and return the deleted lead (verifies ownership in one query)
    const [deletedLead] = await db
      .delete(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, session.user.id)))
      .returning({ id: leads.id });

    if (!deletedLead) {
      return ApiErrors.notFound('Lead');
    }

    return createSuccessResponse({ id: deletedLead.id, deleted: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return ApiErrors.internalError('Failed to delete lead');
  }
}
