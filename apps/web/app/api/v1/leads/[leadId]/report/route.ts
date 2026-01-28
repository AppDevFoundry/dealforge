import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import { getDb } from '@dealforge/database/client';
import { leadIntelligence, leadReports, leads } from '@dealforge/database/schema';
import { and, desc, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';

type RouteParams = { params: Promise<{ leadId: string }> };

/**
 * GET /api/v1/leads/:leadId/report - Generate or retrieve a PDF report
 *
 * Query params:
 * - regenerate: If true, force regeneration of the report
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const regenerate = searchParams.get('regenerate') === 'true';

    const db = getDb();

    // Get lead with intelligence
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

    // Check for existing report if not regenerating
    if (!regenerate) {
      const [existingReport] = await db
        .select()
        .from(leadReports)
        .where(eq(leadReports.leadId, leadId))
        .orderBy(desc(leadReports.version))
        .limit(1);

      if (existingReport) {
        return createSuccessResponse({
          reportId: existingReport.id,
          version: existingReport.version,
          fileName: existingReport.fileName,
          createdAt: existingReport.createdAt,
          downloadUrl: `/api/v1/leads/${leadId}/report/download?reportId=${existingReport.id}`,
        });
      }
    }

    // Get the latest version number
    const [latestReport] = await db
      .select({ version: leadReports.version })
      .from(leadReports)
      .where(eq(leadReports.leadId, leadId))
      .orderBy(desc(leadReports.version))
      .limit(1);

    const newVersion = (latestReport?.version ?? 0) + 1;

    // Create report snapshot
    const reportData = {
      lead: result.lead,
      intelligence: result.intelligence,
      generatedAt: new Date().toISOString(),
      version: newVersion,
    };

    // Generate filename
    const addressSlug = result.lead.address
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50)
      .toLowerCase();
    const fileName = `due-diligence-${addressSlug}-v${newVersion}.pdf`;

    // Save report record
    const [newReport] = await db
      .insert(leadReports)
      .values({
        leadId,
        version: newVersion,
        fileName,
        reportData,
      })
      .returning();

    return createSuccessResponse({
      reportId: newReport!.id,
      version: newReport!.version,
      fileName: newReport!.fileName,
      createdAt: newReport!.createdAt,
      downloadUrl: `/api/v1/leads/${leadId}/report/download?reportId=${newReport!.id}`,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return ApiErrors.internalError('Failed to generate report');
  }
}
