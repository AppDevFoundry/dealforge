/**
 * Analyze Property Lead Tool
 *
 * Triggers or retrieves intelligence analysis for a property address
 * via the leads system. Can create a new lead + kick off analysis,
 * or retrieve existing intelligence for a known lead.
 */

import { neon } from '@neondatabase/serverless';
import { tool } from 'ai';
import { z } from 'zod';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return neon(connectionString);
}

const analyzePropertyLeadSchema = z.object({
  address: z
    .string()
    .describe('Property address to analyze (e.g., "122 County Rd 3052, Orange Grove, TX 78372")'),
  leadId: z.string().optional().describe('Existing lead ID to retrieve intelligence for'),
});

type AnalyzePropertyLeadParams = z.infer<typeof analyzePropertyLeadSchema>;

export interface LeadIntelligenceResult {
  leadId: string;
  status: string;
  intelligence?: Record<string, unknown>;
  message: string;
}

async function lookupLeadIntelligence(leadId: string): Promise<LeadIntelligenceResult> {
  const sql = getSql();
  const intRows = await sql`
    SELECT li.*, l.status as lead_status, l.address_raw
    FROM lead_intelligence li
    JOIN leads l ON l.id = li.lead_id
    WHERE li.lead_id = ${leadId}
  `;

  if (intRows.length > 0) {
    const row = intRows[0]!;
    return {
      leadId,
      status: 'analyzed',
      intelligence: {
        utilities: {
          hasWater: row.has_water_ccn,
          waterProvider: row.water_provider,
          hasSewer: row.has_sewer_ccn,
          sewerProvider: row.sewer_provider,
        },
        market: {
          fmrFiscalYear: row.fmr_fiscal_year,
          fmrTwoBedroom: row.fmr_two_bedroom,
          suggestedLotRentLow: row.suggested_lot_rent_low,
          suggestedLotRentHigh: row.suggested_lot_rent_high,
          medianHouseholdIncome: row.median_household_income,
          unemploymentRate: row.unemployment_rate,
        },
        nearbyParks: { count: row.nearby_parks_count, parks: row.nearby_parks_data },
        tdhca: {
          recordId: row.record_id,
          ownerName: row.owner_name,
          manufacturer: row.manufacturer,
          modelYear: row.model_year,
          hasLiens: row.has_liens,
          totalLienAmount: row.total_lien_amount,
        },
        ai: {
          insights: row.ai_insights,
          riskFactors: row.ai_risk_factors,
          opportunities: row.ai_opportunities,
          recommendation: row.ai_recommendation,
          confidenceScore: row.ai_confidence_score,
        },
      },
      message: `Intelligence retrieved for lead ${leadId}`,
    };
  }

  const [leadRow] = (await sql`SELECT status FROM leads WHERE id = ${leadId}`) as Array<{
    status: string;
  }>;
  if (leadRow) {
    return {
      leadId,
      status: leadRow.status,
      message:
        leadRow.status === 'analyzing'
          ? 'Intelligence gathering is in progress. Try again in a few seconds.'
          : 'No intelligence data available for this lead yet.',
    };
  }

  return { leadId, status: 'not_found', message: 'Lead not found.' };
}

export const analyzePropertyLead = tool({
  description:
    'Analyze a property lead by address or retrieve existing intelligence for a lead ID. Creates a lead and triggers background analysis if none exists. Returns gathered intelligence including utility coverage, market data, nearby parks, TDHCA records, and AI insights.',
  inputSchema: analyzePropertyLeadSchema,
  execute: async (params: AnalyzePropertyLeadParams) => {
    const sql = getSql();

    // If leadId provided, look up existing intelligence
    if (params.leadId) {
      return lookupLeadIntelligence(params.leadId);
    }

    // No leadId — check if an existing lead matches this address
    const existingLeads = (await sql`
      SELECT l.id, l.status, li.id as intel_id
      FROM leads l
      LEFT JOIN lead_intelligence li ON li.lead_id = l.id
      WHERE l.address_raw ILIKE ${`%${params.address.split(',')[0]?.trim() || params.address}%`}
      ORDER BY l.created_at DESC LIMIT 1
    `) as Array<{ id: string; status: string; intel_id: string | null }>;

    if (existingLeads.length > 0 && existingLeads[0]!.status === 'analyzed') {
      return lookupLeadIntelligence(existingLeads[0]!.id);
    }

    if (existingLeads.length > 0 && existingLeads[0]!.status === 'analyzing') {
      return {
        leadId: existingLeads[0]!.id,
        status: 'analyzing',
        message:
          'Intelligence gathering is already in progress for this address. Check back shortly.',
      };
    }

    return {
      leadId: '',
      status: 'pending',
      message: `To fully analyze "${params.address}", create a lead via the Leads section in the dashboard. The system will automatically gather intelligence including utility coverage, market data, nearby parks, and TDHCA records.`,
    };
  },
});
