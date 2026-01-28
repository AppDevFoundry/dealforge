import { ApiErrors } from '@/lib/api';
import { getServerSession } from '@/lib/auth-server';
import { DueDiligenceReport } from '@/lib/reports/templates/due-diligence';
import { getDb } from '@dealforge/database/client';
import { leadIntelligence, leadReports, leads } from '@dealforge/database/schema';
import { renderToBuffer } from '@react-pdf/renderer';
import { and, eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import React from 'react';

type RouteParams = { params: Promise<{ leadId: string }> };

/**
 * GET /api/v1/leads/:leadId/report - Generate and download PDF report
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { leadId } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return ApiErrors.unauthorized();
    }

    const db = getDb();

    // Verify lead ownership
    const [lead] = await db
      .select()
      .from(leads)
      .where(and(eq(leads.id, leadId), eq(leads.userId, session.user.id)))
      .limit(1);

    if (!lead) {
      return ApiErrors.notFound('Lead');
    }

    // Fetch intelligence
    const [intelligence] = await db
      .select()
      .from(leadIntelligence)
      .where(eq(leadIntelligence.leadId, leadId))
      .limit(1);

    const generatedAt = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Render PDF — cast to satisfy @react-pdf/renderer's strict ReactElement type
    const reportElement = React.createElement(DueDiligenceReport, {
      lead: {
        addressRaw: lead.addressRaw,
        city: lead.city,
        state: lead.state,
        zipCode: lead.zipCode,
        county: lead.county,
        propertyType: lead.propertyType,
        yearBuilt: lead.yearBuilt,
        beds: lead.beds,
        baths: lead.baths,
        sqft: lead.sqft,
        acreage: lead.acreage,
        condition: lead.condition,
        conditionNotes: lead.conditionNotes,
        askingPrice: lead.askingPrice,
        mortgageBalance: lead.mortgageBalance,
        taxesOwed: lead.taxesOwed,
        estimatedRepairs: lead.estimatedRepairs,
        sellerName: lead.sellerName,
        sellerPhone: lead.sellerPhone,
        sellerMotivation: lead.sellerMotivation,
        notes: lead.notes,
      },
      intelligence: intelligence
        ? {
            hasWaterCcn: intelligence.hasWaterCcn as boolean,
            waterProvider: intelligence.waterProvider,
            hasSewerCcn: intelligence.hasSewerCcn as boolean,
            sewerProvider: intelligence.sewerProvider,
            fmrFiscalYear: intelligence.fmrFiscalYear,
            fmrTwoBedroom: intelligence.fmrTwoBedroom,
            suggestedLotRentLow: intelligence.suggestedLotRentLow,
            suggestedLotRentHigh: intelligence.suggestedLotRentHigh,
            medianHouseholdIncome: intelligence.medianHouseholdIncome,
            unemploymentRate: intelligence.unemploymentRate,
            populationGrowthRate: intelligence.populationGrowthRate,
            nearbyParksCount: intelligence.nearbyParksCount ?? 0,
            ownerName: intelligence.ownerName,
            manufacturer: intelligence.manufacturer,
            modelYear: intelligence.modelYear,
            hasLiens: intelligence.hasLiens as boolean,
            totalLienAmount: intelligence.totalLienAmount,
            aiInsights: intelligence.aiInsights as string[],
            aiRiskFactors: intelligence.aiRiskFactors as string[],
            aiOpportunities: intelligence.aiOpportunities as string[],
            aiRecommendation: intelligence.aiRecommendation,
            aiConfidenceScore: intelligence.aiConfidenceScore,
          }
        : undefined,
      generatedAt,
    });
    const pdfBuffer = await renderToBuffer(reportElement as Parameters<typeof renderToBuffer>[0]);

    // Record the report generation
    const fileName = `lead-${leadId}-due-diligence.pdf`;
    await db.insert(leadReports).values({
      leadId,
      reportType: 'due_diligence',
      fileName,
      fileSizeBytes: pdfBuffer.length,
      generatedBy: 'system',
    });

    // Stream PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return ApiErrors.internalError('Failed to generate report');
  }
}
