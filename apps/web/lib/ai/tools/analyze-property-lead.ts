/**
 * Analyze Property Lead Tool
 *
 * Creates a new lead from a property address and gathers intelligence,
 * returning a summary for the user. This is the primary way to create
 * leads through the Deal Scout chat interface.
 */

import { neon } from '@neondatabase/serverless';
import { tool } from 'ai';
import { z } from 'zod';

import {
  gatherLeadIntelligence,
  saveLeadIntelligence,
  updateLeadWithGeocode,
} from '@/lib/leads/intelligence';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

const analyzePropertyLeadSchema = z.object({
  address: z.string().describe('Full street address (e.g., "123 Main St, San Antonio, TX 78201")'),
  userId: z.string().describe('User ID to associate the lead with'),
  propertyType: z
    .enum(['singlewide', 'doublewide', 'land_only', 'land_with_home', 'park', 'other'])
    .optional()
    .describe('Type of property'),
  askingPrice: z.number().optional().describe('Asking price if known'),
  sellerName: z.string().optional().describe('Seller name if known'),
  sellerPhone: z.string().optional().describe('Seller phone number if known'),
  notes: z.string().optional().describe('Additional notes about the lead'),
});

type AnalyzePropertyLeadParams = z.infer<typeof analyzePropertyLeadSchema>;

export interface AnalyzePropertyLeadResult {
  leadId: string;
  address: string;
  status: string;
  location?: {
    city?: string;
    county?: string;
    state?: string;
    zipCode?: string;
    latitude?: number;
    longitude?: number;
  };
  utilities: {
    hasWater: boolean;
    hasSewer: boolean;
    waterProvider?: string;
    sewerProvider?: string;
  };
  floodRisk?: {
    zone?: string;
    isHighRisk: boolean;
  };
  marketData?: {
    fmrTwoBedroom?: number;
    suggestedLotRent?: { low: number; high: number };
    medianIncome?: number;
    medianHomeValue?: number;
  };
  nearbyParksCount: number;
  aiRecommendation?: {
    recommendation: string;
    summary: string;
    suggestedOffer?: number;
  };
  viewUrl: string;
}

export const analyzePropertyLead = tool({
  description:
    'Create and analyze a property lead. Geocodes the address, checks utility coverage, flood zones, and nearby competition, then runs AI analysis to provide a recommendation. Returns a summary of the gathered intelligence.',
  inputSchema: analyzePropertyLeadSchema,
  execute: async (params: AnalyzePropertyLeadParams): Promise<AnalyzePropertyLeadResult> => {
    const { address, userId, propertyType, askingPrice, sellerName, sellerPhone, notes } = params;
    const sql = getSql();

    // Create the lead
    const leadRows = (await sql`
      INSERT INTO leads (
        user_id,
        status,
        address,
        property_type,
        asking_price,
        seller_name,
        seller_phone,
        notes,
        lead_source,
        created_at,
        updated_at
      ) VALUES (
        ${userId},
        'analyzing',
        ${address},
        ${propertyType || null},
        ${askingPrice || null},
        ${sellerName || null},
        ${sellerPhone || null},
        ${notes || null},
        'ai_scout',
        NOW(),
        NOW()
      )
      RETURNING id, status
    `) as Array<{ id: string; status: string }>;

    const lead = leadRows[0]!;
    const leadId = lead.id;

    // Create a minimal lead object for intelligence gathering
    const leadForIntelligence = {
      id: leadId,
      userId,
      address,
      propertyType: propertyType || null,
      askingPrice: askingPrice || null,
      city: null,
      county: null,
      state: 'TX',
      zipCode: null,
      latitude: null,
      longitude: null,
    };

    // Gather intelligence
    const intelligence = await gatherLeadIntelligence(leadForIntelligence as any);

    // Update lead with geocoded data if available
    if (intelligence.geocode) {
      await updateLeadWithGeocode(leadId, intelligence.geocode);
    }

    // Save intelligence
    await saveLeadIntelligence(leadId, intelligence);

    // Update lead status to analyzed
    await sql`
      UPDATE leads
      SET status = 'analyzed', analyzed_at = NOW(), updated_at = NOW()
      WHERE id = ${leadId}
    `;

    // Build result
    const result: AnalyzePropertyLeadResult = {
      leadId,
      address,
      status: 'analyzed',
      utilities: {
        hasWater: intelligence.hasWaterCoverage,
        hasSewer: intelligence.hasSewerCoverage,
        waterProvider: intelligence.waterCcn?.utilityName,
        sewerProvider: intelligence.sewerCcn?.utilityName,
      },
      nearbyParksCount: intelligence.nearbyParks.length,
      viewUrl: `/leads/${leadId}`,
    };

    // Add location if geocoded
    if (intelligence.geocode) {
      result.location = {
        city: intelligence.geocode.city,
        county: intelligence.geocode.county,
        state: intelligence.geocode.state,
        zipCode: intelligence.geocode.zipCode,
        latitude: intelligence.geocode.latitude,
        longitude: intelligence.geocode.longitude,
      };
    }

    // Add flood risk
    if (intelligence.floodZone) {
      result.floodRisk = {
        zone: intelligence.floodZone,
        isHighRisk: intelligence.isHighRiskFlood,
      };
    }

    // Add market data
    if (intelligence.fmrData || intelligence.demographics) {
      result.marketData = {};
      if (intelligence.fmrData?.twoBr) {
        result.marketData.fmrTwoBedroom = intelligence.fmrData.twoBr;
        result.marketData.suggestedLotRent = {
          low: Math.round(intelligence.fmrData.twoBr * 0.3),
          high: Math.round(intelligence.fmrData.twoBr * 0.4),
        };
      }
      if (intelligence.demographics?.medianHouseholdIncome) {
        result.marketData.medianIncome = intelligence.demographics.medianHouseholdIncome;
      }
      if (intelligence.demographics?.medianHomeValue) {
        result.marketData.medianHomeValue = intelligence.demographics.medianHomeValue;
      }
    }

    // Add AI recommendation
    if (intelligence.aiAnalysis) {
      result.aiRecommendation = {
        recommendation: intelligence.aiAnalysis.recommendation,
        summary: intelligence.aiAnalysis.summary,
        suggestedOffer: intelligence.aiAnalysis.suggestedOffer ?? undefined,
      };
    }

    return result;
  },
});
