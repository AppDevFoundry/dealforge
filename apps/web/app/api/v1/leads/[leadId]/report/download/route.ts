import { ApiErrors } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import { getDb } from '@dealforge/database/client';
import { leadIntelligence, leadReports, leads } from '@dealforge/database/schema';
import { renderToBuffer } from '@react-pdf/renderer';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import React from 'react';

import { DueDiligenceReport } from '@/lib/reports/templates/due-diligence';

type RouteParams = { params: Promise<{ leadId: string }> };

/**
 * GET /api/v1/leads/:leadId/report/download - Download PDF report
 *
 * Query params:
 * - reportId: Specific report ID to download (optional, uses latest if not provided)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const session = await getServerSession();

    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');

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

    // Get report metadata
    let report;
    if (reportId) {
      const [r] = await db.select().from(leadReports).where(eq(leadReports.id, reportId)).limit(1);
      report = r;
    } else {
      const [r] = await db
        .select()
        .from(leadReports)
        .where(eq(leadReports.leadId, leadId))
        .orderBy(leadReports.version)
        .limit(1);
      report = r;
    }

    if (!report) {
      return ApiErrors.notFound('Report');
    }

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      // @ts-expect-error - React PDF types are not fully compatible with React 19
      React.createElement(DueDiligenceReport, {
        lead: result.lead as any,
        intelligence: result.intelligence as any,
        generatedAt: report.createdAt.toISOString(),
        version: report.version,
      })
    );

    // Convert Buffer to Uint8Array for Response
    const uint8Array = new Uint8Array(pdfBuffer);

    // Return PDF with appropriate headers
    return new Response(uint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${report.fileName}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return ApiErrors.internalError('Failed to generate PDF');
  }
}
