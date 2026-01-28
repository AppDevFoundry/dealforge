import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import { getDb } from '@dealforge/database/client';
import { leadIntelligence, leads } from '@dealforge/database/schema';
import { UpdateLeadSchema } from '@dealforge/types';
import { and, eq, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

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

    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, session.user.id)))
      .limit(1);

    if (!lead) {
      return ApiErrors.notFound('Lead');
    }

    // Fetch intelligence if available
    const [intelligence] = await db
      .select()
      .from(leadIntelligence)
      .where(eq(leadIntelligence.leadId, leadId))
      .limit(1);

    // Fetch active job status via raw JSONB containment
    const jobRows = await db.execute(
      sql`SELECT id, status, error_message FROM jobs
          WHERE type = 'lead_intelligence'
            AND parameters @> ${JSON.stringify({ leadId })}::jsonb
          ORDER BY created_at DESC LIMIT 1`
    );
    const activeJob = jobRows.rows?.[0] || null;

    return createSuccessResponse({
      lead,
      intelligence: intelligence || null,
      job: activeJob || null,
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return ApiErrors.internalError('Failed to fetch lead');
  }
}

/**
 * PATCH /api/v1/leads/:leadId - Update lead details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

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

    const [updatedLead] = await db
      .update(leads)
      .set({ ...parseResult.data, updatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning();

    return createSuccessResponse(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return ApiErrors.internalError('Failed to update lead');
  }
}
