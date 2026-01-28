/**
 * Lead Intelligence Service
 *
 * Orchestrates gathering of property intelligence data for leads.
 */

import { checkCCNCoverage } from '@/lib/shared/ccn-coverage';
import { lookupDemographics } from '@/lib/shared/demographics';
import { checkFloodZone, getFloodZoneDescription } from '@/lib/shared/flood-zone';
import { lookupFmr } from '@/lib/shared/fmr-lookup';
import { type GeocodeResult, geocodeAddress } from '@/lib/shared/geocoding';
import { findNearbyParks } from '@/lib/shared/nearby-parks';
import { searchTdhcaRecords } from '@/lib/shared/tdhca-lookup';
import { anthropic } from '@ai-sdk/anthropic';
import type { Lead } from '@dealforge/database/schema';
import type {
  AiAnalysis,
  CcnCoverage,
  Demographics,
  FmrData,
  NearbyPark,
  TdhcaMatch,
} from '@dealforge/types';
import { neon } from '@neondatabase/serverless';
import { generateObject } from 'ai';
import { z } from 'zod';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export interface GatherIntelligenceResult {
  geocode?: GeocodeResult | null;
  waterCcn?: CcnCoverage | null;
  sewerCcn?: CcnCoverage | null;
  hasWaterCoverage: boolean;
  hasSewerCoverage: boolean;
  floodZone?: string | null;
  floodZoneDescription?: string | null;
  isHighRiskFlood: boolean;
  fmrData?: FmrData | null;
  demographics?: Demographics | null;
  tdhcaMatch?: TdhcaMatch | null;
  nearbyParks: NearbyPark[];
  aiAnalysis?: AiAnalysis | null;
}

/**
 * Gather all intelligence for a lead
 */
export async function gatherLeadIntelligence(lead: Lead): Promise<GatherIntelligenceResult> {
  const result: GatherIntelligenceResult = {
    hasWaterCoverage: false,
    hasSewerCoverage: false,
    isHighRiskFlood: false,
    nearbyParks: [],
  };

  // Step 1: Geocode the address
  let coords: { lat: number; lng: number } | null = null;
  let zipCode = lead.zipCode;
  let city = lead.city;
  let county = lead.county;

  if (lead.latitude && lead.longitude) {
    coords = { lat: lead.latitude, lng: lead.longitude };
  } else {
    const geocoded = await geocodeAddress(lead.address);
    if (geocoded) {
      result.geocode = geocoded;
      coords = { lat: geocoded.latitude, lng: geocoded.longitude };
      zipCode = geocoded.zipCode || zipCode;
      city = geocoded.city || city;
      county = geocoded.county || county;
    }
  }

  // Run parallel lookups if we have coordinates
  if (coords) {
    const [utilityCoverage, floodZoneResult, nearbyParks] = await Promise.all([
      checkCCNCoverage(coords.lat, coords.lng),
      checkFloodZone(coords.lat, coords.lng),
      findNearbyParks(coords.lat, coords.lng, 10, 10),
    ]);

    // CCN coverage
    result.hasWaterCoverage = utilityCoverage.hasWater;
    result.hasSewerCoverage = utilityCoverage.hasSewer;
    if (utilityCoverage.waterProvider) {
      result.waterCcn = utilityCoverage.waterProvider;
    }
    if (utilityCoverage.sewerProvider) {
      result.sewerCcn = utilityCoverage.sewerProvider;
    }

    // Flood zone
    if (floodZoneResult) {
      result.floodZone = floodZoneResult.zoneCode;
      result.floodZoneDescription =
        floodZoneResult.zoneDescription || getFloodZoneDescription(floodZoneResult.zoneCode);
      result.isHighRiskFlood = floodZoneResult.isHighRisk;
    }

    // Nearby parks
    result.nearbyParks = nearbyParks.map((park) => ({
      id: park.id,
      name: park.name,
      city: park.city,
      county: park.county,
      lotCount: park.lotCount ?? null,
      distanceMiles: park.distanceMiles,
      distressScore: park.distressScore ?? null,
    }));
  }

  // Run other lookups in parallel
  const [fmrData, demographics, tdhcaMatch] = await Promise.all([
    zipCode ? lookupFmr(zipCode) : Promise.resolve(null),
    county ? lookupDemographics(county, lead.state || 'TX') : Promise.resolve(null),
    searchTdhcaRecords(lead.address, city || undefined, zipCode || undefined),
  ]);

  if (fmrData) {
    result.fmrData = fmrData;
  }
  if (demographics) {
    result.demographics = demographics;
  }
  if (tdhcaMatch) {
    result.tdhcaMatch = tdhcaMatch;
  }

  // Run AI analysis
  result.aiAnalysis = await runAiAnalysis(lead, result);

  return result;
}

/**
 * Run AI analysis on the lead and gathered intelligence
 */
async function runAiAnalysis(
  lead: Lead,
  intelligence: GatherIntelligenceResult
): Promise<AiAnalysis | null> {
  try {
    const analysisSchema = z.object({
      summary: z.string().describe('A 1-2 sentence summary of the overall assessment'),
      insights: z.array(z.string()).describe('Key insights about the property (3-5 bullet points)'),
      risks: z.array(z.string()).describe('Potential risks or concerns (3-5 bullet points)'),
      opportunities: z.array(z.string()).describe('Potential opportunities (2-4 bullet points)'),
      recommendation: z
        .enum(['pursue', 'pass', 'needs_more_info'])
        .describe('Overall recommendation'),
      recommendationReason: z.string().describe('Brief explanation for the recommendation'),
      estimatedARV: z.number().nullable().describe('Estimated after-repair value if applicable'),
      suggestedOffer: z.number().nullable().describe('Suggested offer price based on analysis'),
    });

    const prompt = buildAnalysisPrompt(lead, intelligence);

    const { object } = await generateObject({
      model: anthropic('claude-sonnet-4-20250514'),
      schema: analysisSchema,
      prompt,
    });

    return {
      ...object,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AI analysis failed:', error);
    return null;
  }
}

function buildAnalysisPrompt(lead: Lead, intelligence: GatherIntelligenceResult): string {
  const sections: string[] = [];

  sections.push(`# Property Lead Analysis

You are an expert real estate investment analyst specializing in manufactured housing and mobile home parks in Texas. Analyze this property lead and provide your assessment.

## Property Information
- **Address:** ${lead.address}
- **Property Type:** ${lead.propertyType || 'Unknown'}
- **Condition:** ${lead.propertyCondition || 'Unknown'}
- **Year Built:** ${lead.yearBuilt || 'Unknown'}
- **Home Size:** ${lead.homeSize ? `${lead.homeSize} sq ft` : 'Unknown'}
- **Lot Size:** ${lead.lotSize ? `${lead.lotSize} acres` : 'Unknown'}
- **Bedrooms/Baths:** ${lead.bedrooms || '?'}/${lead.bathrooms || '?'}`);

  if (lead.lotCount) {
    sections.push(`- **Lot Count (Park):** ${lead.lotCount} lots`);
  }

  sections.push(`
## Financials
- **Asking Price:** ${lead.askingPrice ? `$${lead.askingPrice.toLocaleString()}` : 'Not specified'}
- **Estimated Value:** ${lead.estimatedValue ? `$${lead.estimatedValue.toLocaleString()}` : 'Unknown'}
- **Monthly Income:** ${lead.monthlyIncome ? `$${lead.monthlyIncome.toLocaleString()}` : 'Unknown'}
- **Lot Rent (if park):** ${lead.lotRent ? `$${lead.lotRent}/month` : 'N/A'}
- **Annual Taxes:** ${lead.annualTaxes ? `$${lead.annualTaxes.toLocaleString()}` : 'Unknown'}
- **Annual Insurance:** ${lead.annualInsurance ? `$${lead.annualInsurance.toLocaleString()}` : 'Unknown'}`);

  sections.push(`
## Seller Information
- **Name:** ${lead.sellerName || 'Unknown'}
- **Motivation:** ${lead.sellerMotivation || 'Not specified'}
- **Lead Source:** ${lead.leadSource || 'Unknown'}`);

  sections.push(`
## Gathered Intelligence

### Utilities (CCN Coverage)
- **Water:** ${intelligence.hasWaterCoverage ? `Yes - ${intelligence.waterCcn?.utilityName}` : 'No coverage detected'}
- **Sewer:** ${intelligence.hasSewerCoverage ? `Yes - ${intelligence.sewerCcn?.utilityName}` : 'No coverage detected'}`);

  if (intelligence.floodZone) {
    sections.push(`
### Flood Zone
- **Zone:** ${intelligence.floodZone}
- **Risk Level:** ${intelligence.isHighRiskFlood ? 'HIGH RISK - Special Flood Hazard Area' : 'Low/Moderate Risk'}
- **Description:** ${intelligence.floodZoneDescription || 'N/A'}`);
  }

  if (intelligence.fmrData) {
    sections.push(`
### Fair Market Rents (HUD FMR ${intelligence.fmrData.year})
- **2BR FMR:** $${intelligence.fmrData.twoBr}/month
- **Suggested Lot Rent Range:** $${Math.round((intelligence.fmrData.twoBr || 0) * 0.3)}-$${Math.round((intelligence.fmrData.twoBr || 0) * 0.4)}/month`);
  }

  if (intelligence.demographics) {
    const demo = intelligence.demographics;
    sections.push(`
### Market Demographics
- **Population:** ${demo.population?.toLocaleString() || 'Unknown'}
- **Median Household Income:** ${demo.medianHouseholdIncome ? `$${demo.medianHouseholdIncome.toLocaleString()}` : 'Unknown'}
- **Median Home Value:** ${demo.medianHomeValue ? `$${demo.medianHomeValue.toLocaleString()}` : 'Unknown'}
- **Poverty Rate:** ${demo.povertyRate ? `${demo.povertyRate.toFixed(1)}%` : 'Unknown'}
- **Unemployment Rate:** ${demo.unemploymentRate ? `${demo.unemploymentRate.toFixed(1)}%` : 'Unknown'}`);
  }

  if (intelligence.tdhcaMatch) {
    sections.push(`
### TDHCA Record Match
- **Label/HUD:** ${intelligence.tdhcaMatch.labelOrHud}
- **Manufacturer:** ${intelligence.tdhcaMatch.manufacturer || 'Unknown'}
- **Year Manufactured:** ${intelligence.tdhcaMatch.yearMfg || 'Unknown'}
- **Has Tax Lien:** ${intelligence.tdhcaMatch.hasLien ? 'YES' : 'No'}`);

    if (intelligence.tdhcaMatch.hasLien && intelligence.tdhcaMatch.lienAmount) {
      sections.push(`- **Lien Amount:** $${intelligence.tdhcaMatch.lienAmount.toLocaleString()}`);
    }
  }

  if (intelligence.nearbyParks.length > 0) {
    sections.push(`
### Nearby MH Communities (within 10 miles)
${intelligence.nearbyParks
  .slice(0, 5)
  .map(
    (p) =>
      `- ${p.name} (${p.city}) - ${p.distanceMiles} mi${p.lotCount ? `, ${p.lotCount} lots` : ''}${p.distressScore ? `, distress: ${p.distressScore.toFixed(0)}` : ''}`
  )
  .join('\n')}`);
  }

  if (lead.notes) {
    sections.push(`
## Additional Notes
${lead.notes}`);
  }

  sections.push(`
## Your Task
Analyze this lead and provide:
1. A brief summary of your overall assessment
2. Key insights about the property and market
3. Potential risks or concerns
4. Opportunities for value-add or profit
5. Your recommendation (pursue, pass, or needs_more_info)
6. If possible, estimate the ARV and suggest an offer price

Consider factors like:
- Utility infrastructure (lack of CCN = need for well/septic = added cost)
- Flood risk and insurance implications
- Market fundamentals (demographics, FMR levels)
- Seller motivation and deal source
- Nearby competition and market saturation
- TDHCA record status and any liens`);

  return sections.join('\n');
}

/**
 * Save intelligence results to the database
 */
export async function saveLeadIntelligence(
  leadId: string,
  intelligence: GatherIntelligenceResult
): Promise<void> {
  const sql = getSql();

  // Check if intelligence record already exists
  const existing = await sql`
    SELECT id FROM lead_intelligence WHERE lead_id = ${leadId}
  `;

  const now = new Date().toISOString();

  if (existing.length > 0) {
    // Update existing record
    await sql`
      UPDATE lead_intelligence SET
        water_ccn = ${JSON.stringify(intelligence.waterCcn)},
        sewer_ccn = ${JSON.stringify(intelligence.sewerCcn)},
        has_water_coverage = ${intelligence.hasWaterCoverage},
        has_sewer_coverage = ${intelligence.hasSewerCoverage},
        flood_zone = ${intelligence.floodZone},
        flood_zone_description = ${intelligence.floodZoneDescription},
        is_high_risk_flood = ${intelligence.isHighRiskFlood},
        fmr_data = ${JSON.stringify(intelligence.fmrData)},
        demographics = ${JSON.stringify(intelligence.demographics)},
        tdhca_match = ${JSON.stringify(intelligence.tdhcaMatch)},
        nearby_parks = ${JSON.stringify(intelligence.nearbyParks)},
        ai_analysis = ${JSON.stringify(intelligence.aiAnalysis)},
        ai_analyzed_at = ${intelligence.aiAnalysis ? now : null},
        updated_at = ${now}
      WHERE lead_id = ${leadId}
    `;
  } else {
    // Insert new record
    await sql`
      INSERT INTO lead_intelligence (
        lead_id,
        water_ccn,
        sewer_ccn,
        has_water_coverage,
        has_sewer_coverage,
        flood_zone,
        flood_zone_description,
        is_high_risk_flood,
        fmr_data,
        demographics,
        tdhca_match,
        nearby_parks,
        ai_analysis,
        ai_analyzed_at,
        created_at,
        updated_at
      ) VALUES (
        ${leadId},
        ${JSON.stringify(intelligence.waterCcn)},
        ${JSON.stringify(intelligence.sewerCcn)},
        ${intelligence.hasWaterCoverage},
        ${intelligence.hasSewerCoverage},
        ${intelligence.floodZone},
        ${intelligence.floodZoneDescription},
        ${intelligence.isHighRiskFlood},
        ${JSON.stringify(intelligence.fmrData)},
        ${JSON.stringify(intelligence.demographics)},
        ${JSON.stringify(intelligence.tdhcaMatch)},
        ${JSON.stringify(intelligence.nearbyParks)},
        ${JSON.stringify(intelligence.aiAnalysis)},
        ${intelligence.aiAnalysis ? now : null},
        ${now},
        ${now}
      )
    `;
  }
}

/**
 * Update lead with geocoded data
 */
export async function updateLeadWithGeocode(leadId: string, geocode: GeocodeResult): Promise<void> {
  const sql = getSql();

  await sql`
    UPDATE leads SET
      latitude = ${geocode.latitude},
      longitude = ${geocode.longitude},
      city = COALESCE(city, ${geocode.city}),
      county = COALESCE(county, ${geocode.county}),
      state = COALESCE(state, ${geocode.state}),
      zip_code = COALESCE(zip_code, ${geocode.zipCode}),
      updated_at = ${new Date().toISOString()}
    WHERE id = ${leadId}
  `;
}
