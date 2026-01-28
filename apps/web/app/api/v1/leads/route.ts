import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import { executeLeadIntelligence } from '@/lib/leads/intelligence';
import { getDb } from '@dealforge/database/client';
import { jobs, leadIntelligence, leads } from '@dealforge/database/schema';
import { CreateLeadSchema, ListLeadsQuerySchema } from '@dealforge/types';
import { type SQL, and, asc, count, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

/**
 * GET /api/v1/leads - List user's leads
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const queryResult = ListLeadsQuerySchema.safeParse(Object.fromEntries(searchParams));
    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const db = getDb();

    const whereConditions: SQL[] = [eq(leads.userId, session.user.id)];
    if (query.status) whereConditions.push(eq(leads.status, query.status));
    const whereClause = and(...whereConditions);

    const [countResult] = await db.select({ total: count() }).from(leads).where(whereClause);
    const total = countResult?.total ?? 0;

    const sortColumn = query.sortBy === 'createdAt' ? leads.createdAt : leads.updatedAt;
    const orderBy = query.sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const results = await db
      .select()
      .from(leads)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(query.perPage)
      .offset((query.page - 1) * query.perPage);

    // Attach intelligence availability flag
    const leadsWithIntelligence = await Promise.all(
      results.map(async (lead) => {
        const [intel] = await db
          .select({ id: leadIntelligence.id })
          .from(leadIntelligence)
          .where(eq(leadIntelligence.leadId, lead.id))
          .limit(1);
        return { ...lead, hasIntelligence: !!intel };
      })
    );

    return createSuccessResponse(leadsWithIntelligence, {
      pagination: { page: query.page, perPage: query.perPage, total },
    });
  } catch (error) {
    console.error('Error listing leads:', error);
    return ApiErrors.internalError('Failed to list leads');
  }
}

/**
 * POST /api/v1/leads - Create a new lead and trigger intelligence gathering
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const body = await request.json();
    const parseResult = CreateLeadSchema.safeParse(body);
    if (!parseResult.success) {
      return ApiErrors.validationError(parseResult.error.errors);
    }

    const data = parseResult.data;
    const db = getDb();

    const [newLead] = await db
      .insert(leads)
      .values({
        userId: session.user.id,
        ...data,
        status: 'analyzing',
      })
      .returning();

    if (!newLead) {
      return ApiErrors.internalError('Failed to create lead');
    }

    // Create job record for tracking
    const [newJob] = await db
      .insert(jobs)
      .values({
        type: 'lead_intelligence',
        status: 'pending',
        parameters: { leadId: newLead.id },
        createdBy: session.user.id,
      })
      .returning();

    if (!newJob) {
      return ApiErrors.internalError('Failed to create intelligence job');
    }

    // Fire-and-forget intelligence gathering (best-effort in serverless)
    executeLeadIntelligence(newJob.id, newLead.id).catch((err) => {
      console.error('Intelligence gathering failed to start:', err);
    });

    return createSuccessResponse(newLead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return ApiErrors.internalError('Failed to create lead');
  }
}
