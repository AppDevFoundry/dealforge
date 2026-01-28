/**
 * Lead Intelligence Orchestrator
 *
 * Gathers data for a lead: geocoding, CCN coverage, market data,
 * nearby parks, TDHCA records, and AI analysis.
 */

import { anthropic } from '@ai-sdk/anthropic';
import { neon } from '@neondatabase/serverless';
import { generateText } from 'ai';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return neon(connectionString);
}

// ============================================================================
// Geocoding (Mapbox)
// ============================================================================

interface GeocodeResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  zipCode: string;
  county?: string;
  city?: string;
}

async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn('MAPBOX_ACCESS_TOKEN not set');
    return null;
  }

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&country=US&types=address&limit=1`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.features?.length) return null;

    const feature = data.features[0];
    const [longitude, latitude] = feature.center;
    let zipCode = '';
    let county = '';
    let city = '';

    for (const ctx of feature.context || []) {
      if (ctx.id.startsWith('postcode')) zipCode = ctx.text;
      else if (ctx.id.startsWith('district')) county = ctx.text.replace(' County', '');
      else if (ctx.id.startsWith('place')) city = ctx.text;
    }

    return { latitude, longitude, formattedAddress: feature.place_name, zipCode, county, city };
  } catch {
    console.error('Geocoding failed');
    return null;
  }
}

// ============================================================================
// CCN Coverage Check
// ============================================================================

interface UtilityCoverage {
  hasWater: boolean;
  waterProvider?: string;
  hasSewer: boolean;
  sewerProvider?: string;
}

async function checkCCNCoverage(lat: number, lng: number): Promise<UtilityCoverage> {
  const sql = getSql();
  const result: UtilityCoverage = { hasWater: false, hasSewer: false };

  try {
    const water = (await sql`
      SELECT utility_name FROM ccn_areas
      WHERE service_type IN ('water', 'both')
        AND ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
      LIMIT 1
    `) as Array<{ utility_name: string }>;

    if (water.length) {
      result.hasWater = true;
      result.waterProvider = water[0]!.utility_name;
    }

    const sewer = (await sql`
      SELECT utility_name FROM ccn_areas
      WHERE service_type IN ('sewer', 'both')
        AND ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326))
      LIMIT 1
    `) as Array<{ utility_name: string }>;

    if (sewer.length) {
      result.hasSewer = true;
      result.sewerProvider = sewer[0]!.utility_name;
    }
  } catch {
    console.warn('CCN check failed — table may not exist');
  }

  return result;
}

// ============================================================================
// Market Data (FMR + Census + BLS)
// ============================================================================

interface MarketData {
  fmrFiscalYear?: number;
  fmrTwoBedroom?: number;
  suggestedLotRentLow?: number;
  suggestedLotRentHigh?: number;
  medianHouseholdIncome?: number;
  unemploymentRate?: number;
  populationGrowthRate?: number;
  mobileHomesPercent?: number;
}

async function getMarketData(zipCode: string): Promise<MarketData> {
  const sql = getSql();
  const result: MarketData = {};

  try {
    // HUD Fair Market Rents
    const fmrRows = (await sql`
      SELECT fiscal_year, two_bedroom FROM hud_fair_market_rents
      WHERE zip_code = ${zipCode} ORDER BY fiscal_year DESC LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (fmrRows[0]) {
      const twoBed = Number(fmrRows[0].two_bedroom) || 0;
      result.fmrFiscalYear = Number(fmrRows[0].fiscal_year);
      result.fmrTwoBedroom = twoBed;
      result.suggestedLotRentLow = Math.round(twoBed * 0.3);
      result.suggestedLotRentHigh = Math.round(twoBed * 0.4);
    }

    // Census demographics
    const censusRows = (await sql`
      SELECT median_household_income, mobile_homes_percent, population_growth_rate
      FROM census_demographics WHERE zip_code = ${zipCode} LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (censusRows[0]) {
      result.medianHouseholdIncome = Number(censusRows[0].median_household_income) || undefined;
      result.mobileHomesPercent = Number(censusRows[0].mobile_homes_percent) || undefined;
      result.populationGrowthRate = Number(censusRows[0].population_growth_rate) || undefined;
    }

    // BLS unemployment
    const blsRows = (await sql`
      SELECT unemployment_rate FROM bls_employment WHERE zip_code = ${zipCode} LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (blsRows[0]) {
      result.unemploymentRate = Number(blsRows[0].unemployment_rate) || undefined;
    }
  } catch {
    console.warn('Market data query failed — tables may not exist');
  }

  return result;
}

// ============================================================================
// Nearby Parks
// ============================================================================

interface NearbyPark {
  id: string;
  name: string;
  distanceMiles: number;
  lotCount: number | null;
  distressScore: number | null;
}

async function findNearbyParks(lat: number, lng: number, radiusMiles = 10): Promise<NearbyPark[]> {
  const sql = getSql();
  const radiusMeters = radiusMiles * 1609.34;

  try {
    const rows = await sql`
      SELECT id, name, lot_count, distress_score,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        ) / 1609.34 as distance_miles
      FROM mh_communities
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY distance_miles LIMIT 10
    `;

    return rows.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      distanceMiles: Math.round((r.distance_miles as number) * 10) / 10,
      lotCount: r.lot_count ? Number(r.lot_count) : null,
      distressScore: r.distress_score ? Number(r.distress_score) : null,
    }));
  } catch {
    console.warn('Nearby parks query failed');
    return [];
  }
}

// ============================================================================
// TDHCA Record Lookup
// ============================================================================

interface TDHCARecord {
  recordId?: string;
  ownerName?: string;
  manufacturer?: string;
  modelYear?: number;
  hasLiens: boolean;
  totalLienAmount: number;
}

async function searchTDHCA(address: string, county?: string): Promise<TDHCARecord> {
  const sql = getSql();
  const result: TDHCARecord = { hasLiens: false, totalLienAmount: 0 };

  try {
    // Search ownership records by install address
    const ownershipRows = (await sql`
      SELECT id, owner_name, manufacturer_name, manufacture_date, serial_number, label
      FROM mh_ownership_records
      WHERE install_address ILIKE ${`%${address.split(',')[0]?.trim() || ''}%`}
        ${county ? `AND install_county ILIKE '%${county}%'` : ''}
      LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (ownershipRows[0]) {
      const rec = ownershipRows[0];
      result.recordId = rec.id as string;
      result.ownerName = rec.owner_name as string;
      result.manufacturer = rec.manufacturer_name as string;

      const dateStr = rec.manufacture_date as string;
      if (dateStr) {
        const year = Number(dateStr.split('-')[0] || dateStr.split('/').pop());
        if (!Number.isNaN(year) && year > 1900) result.modelYear = year;
      }

      // Look up liens by serial_number or label (no FK between tables)
      const serialOrLabel = rec.serial_number || rec.label;
      if (serialOrLabel) {
        const lienRows = (await sql`
          SELECT COALESCE(SUM(tax_amount), 0) as total, COUNT(*) as cnt
          FROM mh_tax_liens
          WHERE (serial_number = ${serialOrLabel} OR label = ${serialOrLabel})
            AND status = 'active'
        `) as Array<{ total: number; cnt: number }>;

        if (lienRows[0]) {
          result.hasLiens = Number(lienRows[0].cnt) > 0;
          result.totalLienAmount = Number(lienRows[0].total) || 0;
        }
      }
    }
  } catch {
    console.warn('TDHCA search failed');
  }

  return result;
}

// ============================================================================
// AI Analysis
// ============================================================================

interface AIAnalysis {
  insights: string[];
  riskFactors: string[];
  opportunities: string[];
  recommendation: string;
  confidenceScore: number;
}

async function runAIAnalysis(
  lead: Record<string, unknown>,
  intelligence: Record<string, unknown>
): Promise<AIAnalysis> {
  const model = anthropic('claude-sonnet-4-20250514');

  const prompt = `You are analyzing a property lead for a manufactured home / mobile home park investment platform.

Lead Details:
${JSON.stringify(lead, null, 2)}

Gathered Intelligence:
${JSON.stringify(intelligence, null, 2)}

Provide a concise analysis with:
1. 3-5 key insights about this property
2. 2-4 risk factors
3. 2-3 opportunities
4. A single recommendation sentence
5. A confidence score 0-100 based on data completeness

Respond in this exact JSON format:
{
  "insights": ["..."],
  "riskFactors": ["..."],
  "opportunities": ["..."],
  "recommendation": "...",
  "confidenceScore": 75
}`;

  try {
    const { text } = await generateText({ model, prompt });

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      insights: parsed.insights || [],
      riskFactors: parsed.riskFactors || [],
      opportunities: parsed.opportunities || [],
      recommendation: parsed.recommendation || '',
      confidenceScore: Number(parsed.confidenceScore) || 50,
    };
  } catch (err) {
    console.error('AI analysis failed:', err);
    return {
      insights: ['AI analysis could not be completed — insufficient data or service error'],
      riskFactors: [],
      opportunities: [],
      recommendation: 'Manual review recommended due to analysis limitations.',
      confidenceScore: 0,
    };
  }
}

// ============================================================================
// Main Orchestrator
// ============================================================================

export async function executeLeadIntelligence(jobId: string, leadId: string): Promise<void> {
  const sql = getSql();

  // Mark job as running
  await sql`UPDATE jobs SET status = 'running', started_at = NOW() WHERE id = ${jobId}`;

  try {
    // Fetch lead data
    const [leadRow] = (await sql`SELECT * FROM leads WHERE id = ${leadId}`) as Array<
      Record<string, unknown>
    >;
    if (!leadRow) throw new Error(`Lead ${leadId} not found`);

    const rawResponses: Record<string, unknown> = {};

    // 1. Geocode
    let coords: { lat: number; lng: number } | null = null;
    let resolvedZip = leadRow.zip_code as string | null;

    if (leadRow.address_raw && !leadRow.latitude) {
      const geocoded = await geocodeAddress(leadRow.address_raw as string);
      rawResponses.geocode = geocoded;

      if (geocoded) {
        coords = { lat: geocoded.latitude, lng: geocoded.longitude };
        resolvedZip = geocoded.zipCode || resolvedZip;

        await sql`
          UPDATE leads SET
            address_normalized = ${geocoded.formattedAddress},
            latitude = ${geocoded.latitude},
            longitude = ${geocoded.longitude},
            city = COALESCE(city, ${geocoded.city || null}),
            county = COALESCE(county, ${geocoded.county || null}),
            zip_code = COALESCE(zip_code, ${geocoded.zipCode || null})
          WHERE id = ${leadId}
        `;
      }
    } else if (leadRow.latitude && leadRow.longitude) {
      coords = { lat: Number(leadRow.latitude), lng: Number(leadRow.longitude) };
    }

    // 2. CCN Coverage
    let utilities: UtilityCoverage = { hasWater: false, hasSewer: false };
    if (coords) {
      utilities = await checkCCNCoverage(coords.lat, coords.lng);
      rawResponses.ccn = utilities;
    }

    // 3. Market Data
    let market: MarketData = {};
    if (resolvedZip) {
      market = await getMarketData(resolvedZip);
      rawResponses.market = market;
    }

    // 4. Nearby Parks
    let nearbyParks: NearbyPark[] = [];
    if (coords) {
      nearbyParks = await findNearbyParks(coords.lat, coords.lng);
      rawResponses.nearbyParks = nearbyParks;
    }

    // 5. TDHCA Lookup
    const tdhca = await searchTDHCA(
      leadRow.address_raw as string,
      leadRow.county as string | undefined
    );
    rawResponses.tdhca = tdhca;

    // 6. AI Analysis
    const intelligenceData = { utilities, market, nearbyParks, tdhca };
    const ai = await runAIAnalysis(
      {
        addressRaw: leadRow.address_raw,
        city: leadRow.city,
        county: leadRow.county,
        zipCode: leadRow.zip_code,
      },
      intelligenceData
    );
    rawResponses.ai = ai;

    // 7. Save intelligence record
    const intelId = `lint_${globalThis.crypto.randomUUID().replace(/-/g, '')}`;
    await sql`
      INSERT INTO lead_intelligence (
        id, lead_id, has_water_ccn, water_provider, has_sewer_ccn, sewer_provider,
        fmr_fiscal_year, fmr_two_bedroom, suggested_lot_rent_low, suggested_lot_rent_high,
        median_household_income, unemployment_rate, population_growth_rate, mobile_homes_percent,
        nearby_parks_count, nearby_parks_data,
        record_id, owner_name, manufacturer, model_year, has_liens, total_lien_amount,
        ai_insights, ai_risk_factors, ai_opportunities, ai_recommendation, ai_confidence_score,
        raw_responses
      ) VALUES (
        ${intelId}, ${leadId},
        ${utilities.hasWater}, ${utilities.waterProvider || null},
        ${utilities.hasSewer}, ${utilities.sewerProvider || null},
        ${market.fmrFiscalYear || null}, ${market.fmrTwoBedroom || null},
        ${market.suggestedLotRentLow || null}, ${market.suggestedLotRentHigh || null},
        ${market.medianHouseholdIncome || null}, ${market.unemploymentRate || null},
        ${market.populationGrowthRate || null}, ${market.mobileHomesPercent || null},
        ${nearbyParks.length}, ${JSON.stringify(nearbyParks)},
        ${tdhca.recordId || null}, ${tdhca.ownerName || null},
        ${tdhca.manufacturer || null}, ${tdhca.modelYear || null},
        ${tdhca.hasLiens}, ${tdhca.totalLienAmount},
        ${JSON.stringify(ai.insights)}, ${JSON.stringify(ai.riskFactors)},
        ${JSON.stringify(ai.opportunities)}, ${ai.recommendation},
        ${ai.confidenceScore},
        ${JSON.stringify(rawResponses)}
      )
      ON CONFLICT (lead_id) DO UPDATE SET
        has_water_ccn = EXCLUDED.has_water_ccn, water_provider = EXCLUDED.water_provider,
        has_sewer_ccn = EXCLUDED.has_sewer_ccn, sewer_provider = EXCLUDED.sewer_provider,
        fmr_fiscal_year = EXCLUDED.fmr_fiscal_year, fmr_two_bedroom = EXCLUDED.fmr_two_bedroom,
        suggested_lot_rent_low = EXCLUDED.suggested_lot_rent_low,
        suggested_lot_rent_high = EXCLUDED.suggested_lot_rent_high,
        median_household_income = EXCLUDED.median_household_income,
        unemployment_rate = EXCLUDED.unemployment_rate,
        population_growth_rate = EXCLUDED.population_growth_rate,
        mobile_homes_percent = EXCLUDED.mobile_homes_percent,
        nearby_parks_count = EXCLUDED.nearby_parks_count,
        nearby_parks_data = EXCLUDED.nearby_parks_data,
        record_id = EXCLUDED.record_id, owner_name = EXCLUDED.owner_name,
        manufacturer = EXCLUDED.manufacturer, model_year = EXCLUDED.model_year,
        has_liens = EXCLUDED.has_liens, total_lien_amount = EXCLUDED.total_lien_amount,
        ai_insights = EXCLUDED.ai_insights, ai_risk_factors = EXCLUDED.ai_risk_factors,
        ai_opportunities = EXCLUDED.ai_opportunities, ai_recommendation = EXCLUDED.ai_recommendation,
        ai_confidence_score = EXCLUDED.ai_confidence_score,
        raw_responses = EXCLUDED.raw_responses, updated_at = NOW()
    `;

    // 8. Update lead status to analyzed
    await sql`UPDATE leads SET status = 'analyzed', analyzed_at = NOW(), updated_at = NOW() WHERE id = ${leadId}`;

    // 9. Mark job completed
    await sql`UPDATE jobs SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = ${jobId}`;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Intelligence gathering failed for lead ${leadId}:`, errorMessage);

    await sql`
      UPDATE jobs SET status = 'failed', error_message = ${errorMessage}, completed_at = NOW(), updated_at = NOW()
      WHERE id = ${jobId}
    `;
    await sql`UPDATE leads SET status = 'new', updated_at = NOW() WHERE id = ${leadId}`;
  }
}
