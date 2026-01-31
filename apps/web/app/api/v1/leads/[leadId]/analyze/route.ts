import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import {
  autoFillLeadFromParcel,
  gatherLeadIntelligence,
  saveLeadIntelligence,
  updateLeadWithGeocode,
} from '@/lib/leads/intelligence';
import { getDb } from '@dealforge/database/client';
import { leads } from '@dealforge/database/schema';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ leadId: string }> };

/**
 * POST /api/v1/leads/:leadId/analyze - Trigger re-analysis of a lead
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

    // Get lead and verify ownership
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, session.user.id)))
      .limit(1);

    if (!lead) {
      return ApiErrors.notFound('Lead');
    }

    // Update status to analyzing
    await db
      .update(leads)
      .set({
        status: 'analyzing',
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId));

    // Run analysis (this time we wait for it to complete)
    const intelligence = await gatherLeadIntelligence(lead);

    // Update lead with geocoded data if available
    if (intelligence.geocode) {
      await updateLeadWithGeocode(lead.id, intelligence.geocode);
    }

    // Auto-fill lead fields from parcel data (quick wins)
    if (intelligence.parcelData) {
      const { fieldsUpdated } = await autoFillLeadFromParcel(lead.id, intelligence.parcelData);
      if (fieldsUpdated.length > 0) {
        console.log(`Auto-filled lead ${lead.id} with parcel data:`, fieldsUpdated);
      }
    }

    // Save intelligence
    await saveLeadIntelligence(lead.id, intelligence);

    // Update lead status to analyzed
    const [updatedLead] = await db
      .update(leads)
      .set({
        status: 'analyzed',
        analyzedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId))
      .returning();

    return createSuccessResponse({
      lead: updatedLead,
      intelligence,
    });
  } catch (error) {
    console.error('Error analyzing lead:', error);
    return ApiErrors.internalError('Failed to analyze lead');
  }
}
