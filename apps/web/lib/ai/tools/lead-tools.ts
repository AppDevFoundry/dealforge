/**
 * Lead-Specific AI Tools
 *
 * Tools that operate on lead data for context-aware lead analysis conversations.
 */

import { neon } from '@neondatabase/serverless';
import { tool } from 'ai';
import { z } from 'zod';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

// ============================================================================
// Tool 1: Get Lead Details
// ============================================================================

const getLeadDetailsSchema = z.object({
  leadId: z.string().describe('The unique ID of the lead'),
});

type GetLeadDetailsParams = z.infer<typeof getLeadDetailsSchema>;

export const getLeadDetails = tool({
  description:
    'Fetch complete lead data including property details, financials, seller information, and gathered intelligence (utilities, flood zone, demographics, nearby parks, AI analysis). Use this when you need to access or refresh detailed lead information during a conversation.',
  inputSchema: getLeadDetailsSchema,
  execute: async (params: GetLeadDetailsParams) => {
    const { leadId } = params;
    const sql = getSql();

    // Fetch lead with intelligence
    const rows = await sql`
      SELECT
        l.*,
        li.water_ccn,
        li.sewer_ccn,
        li.has_water_coverage,
        li.has_sewer_coverage,
        li.flood_zone,
        li.flood_zone_description,
        li.is_high_risk_flood,
        li.fmr_data,
        li.demographics,
        li.tdhca_match,
        li.nearby_parks,
        li.ai_analysis,
        li.ai_analyzed_at
      FROM leads l
      LEFT JOIN lead_intelligence li ON l.id = li.lead_id
      WHERE l.id = ${leadId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        found: false,
        error: `Lead with ID "${leadId}" not found`,
      };
    }

    const lead = rows[0]!;

    return {
      found: true,
      lead: {
        id: lead.id,
        status: lead.status,
        address: lead.address,
        city: lead.city,
        county: lead.county,
        state: lead.state,
        zipCode: lead.zip_code,
        latitude: lead.latitude,
        longitude: lead.longitude,
        propertyType: lead.property_type,
        propertyCondition: lead.property_condition,
        yearBuilt: lead.year_built,
        lotSize: lead.lot_size,
        homeSize: lead.home_size,
        bedrooms: lead.bedrooms,
        bathrooms: lead.bathrooms,
        lotCount: lead.lot_count,
        askingPrice: lead.asking_price,
        estimatedValue: lead.estimated_value,
        lotRent: lead.lot_rent,
        monthlyIncome: lead.monthly_income,
        annualTaxes: lead.annual_taxes,
        annualInsurance: lead.annual_insurance,
        sellerName: lead.seller_name,
        sellerPhone: lead.seller_phone,
        sellerEmail: lead.seller_email,
        sellerMotivation: lead.seller_motivation,
        leadSource: lead.lead_source,
        notes: lead.notes,
        createdAt: lead.created_at,
        analyzedAt: lead.analyzed_at,
      },
      intelligence: {
        hasWaterCoverage: lead.has_water_coverage,
        hasSewerCoverage: lead.has_sewer_coverage,
        waterCcn: lead.water_ccn,
        sewerCcn: lead.sewer_ccn,
        floodZone: lead.flood_zone,
        floodZoneDescription: lead.flood_zone_description,
        isHighRiskFlood: lead.is_high_risk_flood,
        fmrData: lead.fmr_data,
        demographics: lead.demographics,
        tdhcaMatch: lead.tdhca_match,
        nearbyParks: lead.nearby_parks,
        aiAnalysis: lead.ai_analysis,
        aiAnalyzedAt: lead.ai_analyzed_at,
      },
    };
  },
});

// ============================================================================
// Tool 2: Estimate Lead Offer
// ============================================================================

const estimateLeadOfferSchema = z.object({
  leadId: z.string().describe('The unique ID of the lead'),
  targetCapRate: z
    .number()
    .min(0)
    .max(100)
    .default(8.5)
    .describe('Target capitalization rate as percentage (default 8.5%)'),
  downPayment: z
    .number()
    .min(0)
    .max(100)
    .default(25)
    .describe('Down payment percentage (default 25%)'),
});

type EstimateLeadOfferParams = z.infer<typeof estimateLeadOfferSchema>;

export const estimateLeadOffer = tool({
  description:
    'Calculate offer scenarios for a lead property based on financials and market data. Returns conservative, moderate, and aggressive offer ranges with projected cash-on-cash returns and IRR. Considers asking price, estimated income, market rents, and acquisition costs.',
  inputSchema: estimateLeadOfferSchema,
  execute: async (params: EstimateLeadOfferParams) => {
    const { leadId, targetCapRate, downPayment } = params;
    const sql = getSql();

    // Fetch lead with intelligence
    const rows = await sql`
      SELECT
        l.asking_price,
        l.estimated_value,
        l.lot_rent,
        l.monthly_income,
        l.annual_taxes,
        l.annual_insurance,
        l.property_type,
        l.lot_count,
        l.bedrooms,
        li.fmr_data,
        li.ai_analysis
      FROM leads l
      LEFT JOIN lead_intelligence li ON l.id = li.lead_id
      WHERE l.id = ${leadId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        found: false,
        error: `Lead with ID "${leadId}" not found`,
      };
    }

    const lead = rows[0]!;
    const fmrData = lead.fmr_data as Record<string, unknown> | null;
    const aiAnalysis = lead.ai_analysis as Record<string, unknown> | null;

    // Estimate monthly income based on available data
    let monthlyIncome = lead.monthly_income as number | null;

    if (!monthlyIncome && lead.lot_rent) {
      // For parks, use lot rent
      const lotCount = (lead.lot_count as number) || 1;
      monthlyIncome = (lead.lot_rent as number) * lotCount;
    } else if (!monthlyIncome && fmrData) {
      // Estimate from FMR data
      const bedrooms = (lead.bedrooms as number) || 2;
      const fmrKey = bedrooms === 1 ? 'oneBr' : bedrooms >= 3 ? 'threeBr' : 'twoBr';
      const fmr = (fmrData[fmrKey] as number) || 0;
      // Assume lot rent is 35% of FMR
      monthlyIncome = fmr * 0.35;
    }

    if (!monthlyIncome || monthlyIncome === 0) {
      return {
        found: true,
        error: 'Insufficient income data to estimate offer. Need lot rent or FMR data.',
      };
    }

    const annualIncome = monthlyIncome * 12;

    // Estimate annual expenses (30-40% of income for MH parks, 25-35% for other properties)
    const isPark = lead.property_type === 'park';
    const expenseRatio = isPark ? 0.35 : 0.30;
    const annualExpenses = annualIncome * expenseRatio;

    // Add known expenses
    if (lead.annual_taxes) {
      // Expenses already include estimated OpEx, so just note the taxes separately
    }

    const noi = annualIncome - annualExpenses;

    // Calculate offer scenarios based on cap rate
    const conservativeCapRate = targetCapRate + 1.5; // More conservative
    const moderateCapRate = targetCapRate;
    const aggressiveCapRate = targetCapRate - 1.5; // More aggressive

    const conservativeOffer = Math.round(noi / (conservativeCapRate / 100));
    const moderateOffer = Math.round(noi / (moderateCapRate / 100));
    const aggressiveOffer = Math.round(noi / (aggressiveCapRate / 100));

    // Calculate cash-on-cash return (simplified)
    const downPaymentAmount = moderateOffer * (downPayment / 100);
    const loanAmount = moderateOffer - downPaymentAmount;
    const interestRate = 0.07; // Assume 7% interest
    const annualDebtService = loanAmount * interestRate * 1.15; // Rough principal + interest
    const cashFlow = noi - annualDebtService;
    const cashOnCash = downPaymentAmount > 0 ? (cashFlow / downPaymentAmount) * 100 : 0;

    return {
      found: true,
      scenarios: {
        conservative: {
          offerPrice: conservativeOffer,
          capRate: conservativeCapRate,
          pricingStrategy: 'Safe, below-market pricing for quick cash flow',
        },
        moderate: {
          offerPrice: moderateOffer,
          capRate: moderateCapRate,
          pricingStrategy: 'Market-rate pricing based on target cap rate',
        },
        aggressive: {
          offerPrice: aggressiveOffer,
          capRate: aggressiveCapRate,
          pricingStrategy: 'Higher pricing assuming value-add or appreciation',
        },
      },
      financials: {
        annualIncome,
        annualExpenses,
        noi,
        expenseRatio: `${Math.round(expenseRatio * 100)}%`,
      },
      projections: {
        downPaymentAmount: Math.round(downPaymentAmount),
        loanAmount: Math.round(loanAmount),
        estimatedCashFlow: Math.round(cashFlow),
        cashOnCashReturn: `${cashOnCash.toFixed(1)}%`,
      },
      askingPrice: lead.asking_price,
      aiRecommendedOffer: aiAnalysis?.suggestedOffer || null,
      note: 'These are rough estimates. Conduct full due diligence before making an offer.',
    };
  },
});

// ============================================================================
// Tool 3: Identify Lead Red Flags
// ============================================================================

const identifyLeadRedFlagsSchema = z.object({
  leadId: z.string().describe('The unique ID of the lead'),
});

type IdentifyLeadRedFlagsParams = z.infer<typeof identifyLeadRedFlagsSchema>;

export const identifyLeadRedFlags = tool({
  description:
    'Analyze a lead for potential risks and deal-breaking issues. Returns prioritized list of red flags with severity ratings (critical, high, medium, low). Checks utilities, flood risk, title issues, financial viability, and market conditions.',
  inputSchema: identifyLeadRedFlagsSchema,
  execute: async (params: IdentifyLeadRedFlagsParams) => {
    const { leadId } = params;
    const sql = getSql();

    // Fetch lead with intelligence
    const rows = await sql`
      SELECT
        l.*,
        li.has_water_coverage,
        li.has_sewer_coverage,
        li.flood_zone,
        li.is_high_risk_flood,
        li.tdhca_match,
        li.ai_analysis,
        li.demographics
      FROM leads l
      LEFT JOIN lead_intelligence li ON l.id = li.lead_id
      WHERE l.id = ${leadId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        found: false,
        error: `Lead with ID "${leadId}" not found`,
      };
    }

    const lead = rows[0]!;
    const tdhcaMatch = lead.tdhca_match as Record<string, unknown> | null;
    const aiAnalysis = lead.ai_analysis as Record<string, unknown> | null;
    const demographics = lead.demographics as Record<string, unknown> | null;

    const redFlags: Array<{
      severity: 'critical' | 'high' | 'medium' | 'low';
      category: string;
      issue: string;
      impact: string;
      recommendation: string;
    }> = [];

    // Critical: Missing utilities
    if (lead.has_water_coverage === false || lead.has_sewer_coverage === false) {
      redFlags.push({
        severity: 'critical',
        category: 'Infrastructure',
        issue: 'Missing utility coverage',
        impact: `Property lacks ${!lead.has_water_coverage ? 'water' : ''} ${!lead.has_water_coverage && !lead.has_sewer_coverage ? 'and' : ''} ${!lead.has_sewer_coverage ? 'sewer' : ''} CCN coverage`,
        recommendation:
          'Verify if property can be connected. Wells/septic may be required, significantly increasing costs.',
      });
    }

    // Critical: High-risk flood zone
    if (lead.is_high_risk_flood === true) {
      redFlags.push({
        severity: 'critical',
        category: 'Environmental',
        issue: 'High-risk flood zone',
        impact: `Property in flood zone ${lead.flood_zone || 'unknown'} requires expensive flood insurance`,
        recommendation:
          'Obtain flood insurance quotes before proceeding. May make property uninsurable or unprofitable.',
      });
    }

    // High: Active liens on TDHCA record
    if (tdhcaMatch && tdhcaMatch.hasLien === true) {
      const lienAmount = (tdhcaMatch.lienAmount as number) || 0;
      redFlags.push({
        severity: 'high',
        category: 'Title/Liens',
        issue: 'Active tax lien found',
        impact: `TDHCA records show active lien of $${lienAmount.toLocaleString()}`,
        recommendation: 'Verify lien status with county. May need to be paid off at closing.',
      });
    }

    // High: Asking price significantly above estimated value
    if (lead.asking_price && lead.estimated_value) {
      const priceDiff =
        ((lead.asking_price - lead.estimated_value) / lead.estimated_value) * 100;
      if (priceDiff > 25) {
        redFlags.push({
          severity: 'high',
          category: 'Pricing',
          issue: 'Asking price significantly overvalued',
          impact: `Asking price is ${Math.round(priceDiff)}% above estimated market value`,
          recommendation: 'Negotiate aggressively or consider passing on this deal.',
        });
      }
    }

    // Medium: Poor property condition
    if (
      lead.property_condition === 'poor' ||
      lead.property_condition === 'needs_rehab'
    ) {
      redFlags.push({
        severity: 'medium',
        category: 'Property Condition',
        issue: 'Property requires significant repairs',
        impact: 'Condition rated as poor or needs rehab - expect high renovation costs',
        recommendation:
          'Get contractor estimates before making offer. Budget 20-30% of purchase price for repairs.',
      });
    }

    // Medium: Weak local economy
    if (demographics && (demographics.unemploymentRate as number) > 8) {
      redFlags.push({
        severity: 'medium',
        category: 'Market Conditions',
        issue: 'High local unemployment',
        impact: `Unemployment rate of ${demographics.unemploymentRate}% may affect occupancy and rent collection`,
        recommendation: 'Factor in higher vacancy rates and collection challenges.',
      });
    }

    // Low: Missing seller motivation
    if (!lead.seller_motivation || lead.seller_motivation.trim() === '') {
      redFlags.push({
        severity: 'low',
        category: 'Deal Structure',
        issue: 'Unknown seller motivation',
        impact: 'No information about why seller is selling',
        recommendation:
          'Ask seller about motivation. Motivated sellers are more likely to negotiate.',
      });
    }

    // Low: Old property (80+ years)
    const currentYear = new Date().getFullYear();
    if (lead.year_built && currentYear - lead.year_built > 80) {
      redFlags.push({
        severity: 'low',
        category: 'Property Age',
        issue: 'Very old property',
        impact: `Property built in ${lead.year_built} (${currentYear - lead.year_built} years old)`,
        recommendation:
          'Expect dated systems (plumbing, electrical, HVAC). Budget for major replacements.',
      });
    }

    // Include AI-identified risks if available
    if (aiAnalysis && Array.isArray(aiAnalysis.risks)) {
      (aiAnalysis.risks as string[]).forEach((risk) => {
        redFlags.push({
          severity: 'medium',
          category: 'AI Analysis',
          issue: 'AI-identified risk',
          impact: risk,
          recommendation: 'Review AI analysis for detailed context and mitigation strategies.',
        });
      });
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    redFlags.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return {
      found: true,
      redFlagCount: redFlags.length,
      criticalCount: redFlags.filter((f) => f.severity === 'critical').length,
      highCount: redFlags.filter((f) => f.severity === 'high').length,
      mediumCount: redFlags.filter((f) => f.severity === 'medium').length,
      lowCount: redFlags.filter((f) => f.severity === 'low').length,
      redFlags,
      overallRisk:
        redFlags.filter((f) => f.severity === 'critical').length > 0
          ? 'High - Critical issues present'
          : redFlags.filter((f) => f.severity === 'high').length > 0
            ? 'Moderate - Significant concerns'
            : redFlags.length > 3
              ? 'Moderate - Multiple minor issues'
              : 'Low - Manageable concerns',
      recommendation:
        redFlags.filter((f) => f.severity === 'critical').length > 0
          ? 'Consider passing on this deal unless critical issues can be resolved before closing'
          : redFlags.filter((f) => f.severity === 'high').length > 1
            ? 'Proceed with caution. Conduct thorough due diligence on identified issues.'
            : 'Proceed with standard due diligence. No major red flags identified.',
    };
  },
});

// ============================================================================
// Tool 4: Compare Lead to Nearby Parks
// ============================================================================

const compareLeadToNearbyParksSchema = z.object({
  leadId: z.string().describe('The unique ID of the lead'),
  maxResults: z.number().min(1).max(20).default(5).describe('Maximum number of parks to compare'),
});

type CompareLeadToNearbyParksParams = z.infer<typeof compareLeadToNearbyParksSchema>;

export const compareLeadToNearbyParks = tool({
  description:
    'Compare lead property to nearby mobile home parks for market positioning and competitive analysis. Returns comparison table with distance, lot count, distress scores, estimated values, and market insights.',
  inputSchema: compareLeadToNearbyParksSchema,
  execute: async (params: CompareLeadToNearbyParksParams) => {
    const { leadId, maxResults } = params;
    const sql = getSql();

    // Fetch lead with nearby parks intelligence
    const rows = await sql`
      SELECT
        l.asking_price,
        l.estimated_value,
        l.lot_rent,
        l.lot_count,
        l.address,
        l.city,
        l.county,
        li.nearby_parks
      FROM leads l
      LEFT JOIN lead_intelligence li ON l.id = li.lead_id
      WHERE l.id = ${leadId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        found: false,
        error: `Lead with ID "${leadId}" not found`,
      };
    }

    const lead = rows[0]!;
    const nearbyParks = (lead.nearby_parks as Array<Record<string, unknown>>) || [];

    if (nearbyParks.length === 0) {
      return {
        found: true,
        error: 'No nearby mobile home parks found for comparison',
      };
    }

    // Limit results
    const parksToCompare = nearbyParks.slice(0, maxResults);

    // Calculate comparisons
    const leadLotCount = (lead.lot_count as number) || 1;
    const leadValue = lead.estimated_value || lead.asking_price || 0;
    const leadPricePerLot = leadLotCount > 0 ? leadValue / leadLotCount : 0;

    const comparisons = parksToCompare.map((park) => {
      const parkLotCount = (park.lotCount as number) || 0;
      const parkDistressScore = (park.distressScore as number) || 0;

      return {
        name: park.name,
        distance: `${(park.distanceMiles as number).toFixed(1)} miles`,
        city: park.city,
        county: park.county,
        lotCount: parkLotCount,
        distressScore: parkDistressScore,
        distressLevel:
          parkDistressScore >= 70 ? 'High' : parkDistressScore >= 50 ? 'Moderate' : 'Low',
        notes:
          parkDistressScore >= 60
            ? 'Potential acquisition target (distressed)'
            : 'Stable competitor',
      };
    });

    // Market insights
    const avgDistressScore =
      comparisons.reduce((sum, p) => sum + p.distressScore, 0) / comparisons.length;
    const distressedParksCount = comparisons.filter((p) => p.distressScore >= 60).length;

    return {
      found: true,
      leadSummary: {
        address: lead.address,
        city: lead.city,
        county: lead.county,
        askingPrice: lead.asking_price,
        estimatedValue: lead.estimated_value,
        lotCount: leadLotCount,
        pricePerLot: Math.round(leadPricePerLot),
      },
      nearbyParks: comparisons,
      marketInsights: {
        totalParksFound: nearbyParks.length,
        parksShown: comparisons.length,
        avgDistressScore: Math.round(avgDistressScore),
        distressedParksCount,
        marketCondition:
          avgDistressScore >= 60
            ? 'Distressed market with acquisition opportunities'
            : avgDistressScore >= 40
              ? 'Mixed market with some stressed properties'
              : 'Stable market with limited distress',
        competitivePosition:
          distressedParksCount >= 3
            ? 'Strong - many distressed competitors create opportunity'
            : distressedParksCount >= 1
              ? 'Moderate - some competition, some opportunity'
              : 'Challenging - stable competitive landscape',
      },
    };
  },
});

// ============================================================================
// Tool 5: Suggest Lead Follow-Up
// ============================================================================

const suggestLeadFollowUpSchema = z.object({
  leadId: z.string().describe('The unique ID of the lead'),
});

type SuggestLeadFollowUpParams = z.infer<typeof suggestLeadFollowUpSchema>;

export const suggestLeadFollowUp = tool({
  description:
    'Generate due diligence checklist and follow-up questions for seller based on data gaps and lead analysis. Returns recommended next steps, missing information to gather, and questions to ask seller.',
  inputSchema: suggestLeadFollowUpSchema,
  execute: async (params: SuggestLeadFollowUpParams) => {
    const { leadId } = params;
    const sql = getSql();

    // Fetch lead with intelligence
    const rows = await sql`
      SELECT
        l.*,
        li.has_water_coverage,
        li.has_sewer_coverage,
        li.flood_zone,
        li.fmr_data,
        li.demographics,
        li.tdhca_match,
        li.ai_analysis
      FROM leads l
      LEFT JOIN lead_intelligence li ON l.id = li.lead_id
      WHERE l.id = ${leadId}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return {
        found: false,
        error: `Lead with ID "${leadId}" not found`,
      };
    }

    const lead = rows[0]!;
    const aiAnalysis = lead.ai_analysis as Record<string, unknown> | null;

    const missingData: Array<{ field: string; importance: string; howToGet: string }> = [];
    const sellerQuestions: string[] = [];
    const nextSteps: Array<{ priority: string; action: string; reason: string }> = [];

    // Check for missing critical data
    if (!lead.asking_price) {
      missingData.push({
        field: 'Asking Price',
        importance: 'Critical',
        howToGet: 'Ask seller directly',
      });
      sellerQuestions.push('What is your asking price for the property?');
    }

    if (!lead.lot_rent && lead.property_type === 'park') {
      missingData.push({
        field: 'Lot Rent',
        importance: 'Critical',
        howToGet: 'Ask seller or review rent roll',
      });
      sellerQuestions.push('What is the current lot rent per space?');
    }

    if (!lead.monthly_income && !lead.lot_rent) {
      missingData.push({
        field: 'Monthly Income',
        importance: 'Critical',
        howToGet: 'Request rent roll or income statement',
      });
      sellerQuestions.push(
        'Can you provide a rent roll or income statement for the past 12 months?'
      );
    }

    if (!lead.annual_taxes) {
      missingData.push({
        field: 'Annual Property Taxes',
        importance: 'High',
        howToGet: 'Request tax bill or check county assessor',
      });
      sellerQuestions.push('What are the annual property taxes?');
    }

    if (!lead.annual_insurance) {
      missingData.push({
        field: 'Annual Insurance',
        importance: 'High',
        howToGet: 'Ask seller for current policy details',
      });
      sellerQuestions.push('What is your current annual insurance premium?');
    }

    if (!lead.seller_motivation) {
      missingData.push({
        field: 'Seller Motivation',
        importance: 'Medium',
        howToGet: 'Ask seller why they are selling',
      });
      sellerQuestions.push('What is prompting you to sell at this time?');
    }

    if (!lead.property_condition || lead.property_condition === 'unknown') {
      missingData.push({
        field: 'Property Condition',
        importance: 'High',
        howToGet: 'Schedule property inspection',
      });
      nextSteps.push({
        priority: 'High',
        action: 'Schedule property inspection',
        reason: 'Need to assess condition and identify required repairs',
      });
      sellerQuestions.push('What is the overall condition of the property and any major repairs needed?');
    }

    if (!lead.year_built) {
      missingData.push({
        field: 'Year Built',
        importance: 'Medium',
        howToGet: 'Check county records or ask seller',
      });
      sellerQuestions.push('What year was the property/home built?');
    }

    if (lead.property_type === 'park' && !lead.lot_count) {
      missingData.push({
        field: 'Lot Count',
        importance: 'Critical',
        howToGet: 'Ask seller or count on site visit',
      });
      sellerQuestions.push('How many lots/spaces does the park have?');
    }

    // Add next steps based on analysis
    if (lead.has_water_coverage === false || lead.has_sewer_coverage === false) {
      nextSteps.push({
        priority: 'Critical',
        action: 'Verify utility connection options',
        reason: 'Property may lack CCN coverage - investigate well/septic costs',
      });
    }

    if (!lead.latitude || !lead.longitude) {
      nextSteps.push({
        priority: 'High',
        action: 'Geocode property address',
        reason: 'Need location data for flood zone, demographics, and market analysis',
      });
    }

    if (!aiAnalysis) {
      nextSteps.push({
        priority: 'High',
        action: 'Run AI analysis on lead',
        reason: 'Get comprehensive insights, risk assessment, and recommendations',
      });
    }

    nextSteps.push({
      priority: 'High',
      action: 'Run preliminary title search',
      reason: 'Identify any liens, encumbrances, or title issues early',
    });

    nextSteps.push({
      priority: 'Medium',
      action: 'Request financial documents',
      reason: 'Get P&L statements, rent rolls, utility bills, maintenance records',
    });

    // General seller questions
    sellerQuestions.push(
      'Are there any known issues with the property (structural, environmental, legal)?'
    );
    sellerQuestions.push('Are you open to seller financing or flexible closing terms?');
    sellerQuestions.push('What is your ideal timeline for closing?');

    if (lead.property_type === 'park') {
      sellerQuestions.push('What is the current occupancy rate?');
      sellerQuestions.push('Are there any deferred maintenance items or capital expenditures needed?');
    }

    // Sort next steps by priority
    const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    nextSteps.sort(
      (a, b) =>
        priorityOrder[a.priority as keyof typeof priorityOrder] -
        priorityOrder[b.priority as keyof typeof priorityOrder]
    );

    return {
      found: true,
      dataCompleteness: {
        totalFields: 15,
        missingFields: missingData.length,
        completenessScore: Math.round(((15 - missingData.length) / 15) * 100),
        rating:
          missingData.length <= 3
            ? 'Good - Most data present'
            : missingData.length <= 7
              ? 'Fair - Some gaps to fill'
              : 'Poor - Significant data missing',
      },
      missingData,
      sellerQuestions,
      nextSteps,
      recommendedTimeline: {
        immediate: nextSteps.filter((s) => s.priority === 'Critical').map((s) => s.action),
        thisWeek: nextSteps.filter((s) => s.priority === 'High').map((s) => s.action),
        beforeClosing: nextSteps.filter((s) => s.priority === 'Medium').map((s) => s.action),
      },
    };
  },
});
