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
import {
  type ParcelData,
  createParcelSnapshot,
  getLandUseDescription,
  lookupParcel,
  mapLandUseToPropertyType,
} from '@/lib/shared/parcel-lookup';
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
import { createId } from '@paralleldrive/cuid2';
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
  parcelData?: ParcelData | null;
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
    const [utilityCoverage, floodZoneResult, nearbyParks, parcelResult] = await Promise.all([
      checkCCNCoverage(coords.lat, coords.lng),
      checkFloodZone(coords.lat, coords.lng),
      findNearbyParks(coords.lat, coords.lng, 10, 10),
      lookupParcel(coords.lat, coords.lng),
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
      latitude: park.latitude ?? null,
      longitude: park.longitude ?? null,
      lotCount: park.lotCount ?? null,
      distanceMiles: park.distanceMiles,
      distressScore: park.distressScore ?? null,
    }));

    // Parcel data from TxGIO/TNRIS
    if (parcelResult.parcel) {
      result.parcelData = parcelResult.parcel;
    }
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

  if (intelligence.parcelData) {
    const parcel = intelligence.parcelData;
    sections.push(`
### Parcel Data (TxGIO/TNRIS)
- **Property ID:** ${parcel.propId}
- **Owner:** ${parcel.ownerName || 'Unknown'}${parcel.ownerCareOf ? ` (c/o ${parcel.ownerCareOf})` : ''}
- **Legal Description:** ${parcel.legalDescription ? parcel.legalDescription.substring(0, 100) + (parcel.legalDescription.length > 100 ? '...' : '') : 'N/A'}
- **Legal Area:** ${parcel.legalArea ? `${parcel.legalArea.toFixed(2)} ${parcel.legalAreaUnit || 'acres'}` : 'Unknown'}
- **Assessed Values (${parcel.taxYear || 'N/A'}):**
  - Land: ${parcel.landValue ? `$${parcel.landValue.toLocaleString()}` : 'N/A'}
  - Improvements: ${parcel.improvementValue ? `$${parcel.improvementValue.toLocaleString()}` : 'N/A'}
  - Market: ${parcel.marketValue ? `$${parcel.marketValue.toLocaleString()}` : 'N/A'}
- **Land Use:** ${parcel.stateLandUse || parcel.localLandUse || 'Unknown'}`);

    if (parcel.mailAddress && parcel.mailAddress !== parcel.situsAddress) {
      sections.push(`- **Owner Mailing Address:** ${parcel.mailAddress}, ${parcel.mailCity || ''}, ${parcel.mailState || ''} ${parcel.mailZip || ''}`);
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
- TDHCA record status and any liens
- Parcel assessed values vs asking price (if available)
- Owner mailing address differences that may indicate absentee ownership`);

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

  // Create parcel snapshot if parcel data exists
  const parcelId = intelligence.parcelData?.id || null;
  const parcelSnapshot = intelligence.parcelData
    ? JSON.stringify(createParcelSnapshot(intelligence.parcelData))
    : null;

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
        parcel_id = ${parcelId},
        parcel_data = ${parcelSnapshot},
        ai_analysis = ${JSON.stringify(intelligence.aiAnalysis)},
        ai_analyzed_at = ${intelligence.aiAnalysis ? now : null},
        updated_at = ${now}
      WHERE lead_id = ${leadId}
    `;
  } else {
    // Insert new record
    const id = `lint_${createId()}`;
    await sql`
      INSERT INTO lead_intelligence (
        id,
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
        parcel_id,
        parcel_data,
        ai_analysis,
        ai_analyzed_at,
        created_at,
        updated_at
      ) VALUES (
        ${id},
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
        ${parcelId},
        ${parcelSnapshot},
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

/**
 * Auto-fill lead fields from parcel data (quick wins)
 *
 * Updates empty lead fields with data from the parcel record:
 * - Year Built from parcel.yearBuilt
 * - Lot Size from parcel.legalArea (if in acres)
 * - Property Type from land use codes
 * - Estimated Value from parcel.marketValue
 * - Seller Name from parcel.ownerName
 * - County from parcel.county
 */
export async function autoFillLeadFromParcel(
  leadId: string,
  parcel: ParcelData
): Promise<{ fieldsUpdated: string[] }> {
  const sql = getSql();
  const fieldsUpdated: string[] = [];

  // Build dynamic update based on available parcel data
  const updates: string[] = [];
  const values: Record<string, unknown> = {};

  // Year Built
  if (parcel.yearBuilt) {
    const yearBuiltNum = parseInt(parcel.yearBuilt, 10);
    if (!isNaN(yearBuiltNum) && yearBuiltNum > 1900 && yearBuiltNum <= new Date().getFullYear()) {
      updates.push('year_built = COALESCE(year_built, ${yearBuilt})');
      values.yearBuilt = yearBuiltNum;
      fieldsUpdated.push('yearBuilt');
    }
  }

  // Lot Size (convert to acres if needed)
  if (parcel.legalArea && parcel.legalArea > 0) {
    const unit = parcel.legalAreaUnit?.toUpperCase() || '';
    let lotSizeAcres = parcel.legalArea;

    // Convert common units to acres
    if (unit === 'SF' || unit === 'SQ FT' || unit === 'SQFT') {
      lotSizeAcres = parcel.legalArea / 43560;
    } else if (unit === 'SQ M' || unit === 'SQM') {
      lotSizeAcres = parcel.legalArea / 4046.86;
    }
    // If already in AC/ACRES or unknown, assume acres

    updates.push('lot_size = COALESCE(lot_size, ${lotSize})');
    values.lotSize = Math.round(lotSizeAcres * 1000) / 1000; // 3 decimal places
    fieldsUpdated.push('lotSize');
  }

  // Property Type from land use codes
  const derivedPropertyType = mapLandUseToPropertyType(parcel.stateLandUse, parcel.localLandUse);
  if (derivedPropertyType) {
    updates.push('property_type = COALESCE(property_type, ${propertyType})');
    values.propertyType = derivedPropertyType;
    fieldsUpdated.push('propertyType');
  }

  // Estimated Value from market value
  if (parcel.marketValue && parcel.marketValue > 0) {
    updates.push('estimated_value = COALESCE(estimated_value, ${estimatedValue})');
    values.estimatedValue = Math.round(parcel.marketValue);
    fieldsUpdated.push('estimatedValue');
  }

  // Seller Name from owner name
  if (parcel.ownerName) {
    updates.push('seller_name = COALESCE(seller_name, ${sellerName})');
    values.sellerName = parcel.ownerName;
    fieldsUpdated.push('sellerName');
  }

  // County
  if (parcel.county && parcel.county !== 'UNKNOWN') {
    updates.push('county = COALESCE(county, ${county})');
    values.county = parcel.county;
    fieldsUpdated.push('county');
  }

  // Only update if we have changes
  if (updates.length === 0) {
    return { fieldsUpdated: [] };
  }

  // Execute the update with COALESCE to preserve existing values
  const now = new Date().toISOString();

  await sql`
    UPDATE leads SET
      year_built = COALESCE(year_built, ${values.yearBuilt || null}),
      lot_size = COALESCE(lot_size, ${values.lotSize || null}),
      property_type = COALESCE(property_type, ${values.propertyType || null}),
      estimated_value = COALESCE(estimated_value, ${values.estimatedValue || null}),
      seller_name = COALESCE(seller_name, ${values.sellerName || null}),
      county = COALESCE(county, ${values.county || null}),
      updated_at = ${now}
    WHERE id = ${leadId}
  `;

  return { fieldsUpdated };
}
