/**
 * AI configuration for Deal Scout agent
 *
 * Configures Anthropic Claude model and system prompt for
 * distressed mobile home park acquisition analysis.
 */

import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

/**
 * Park context data for context-aware chat
 */
export interface ParkContext {
  id: string;
  name: string;
  county: string;
  lotCount: number | null;
  distressScore: number | null;
}

/**
 * Lead context data for context-aware chat
 */
export interface LeadContext {
  id: string;
  address: string;
  city?: string | null;
  county?: string | null;
  state?: string | null;
  propertyType?: string | null;
  propertyCondition?: string | null;
  status: string;
  askingPrice?: number | null;
  estimatedValue?: number | null;
  lotRent?: number | null;
  hasIntelligence: boolean;
  intelligenceHighlights?: {
    hasUtilities: boolean;
    floodRisk: string;
    nearbyParksCount: number;
    aiRecommendation: string;
  };
}

/**
 * Context passed from the chat panel for context-aware responses
 */
export interface ChatContext {
  page: string;
  park: ParkContext | null;
  lead: LeadContext | null;
}

/**
 * Configure the AI model for Deal Scout
 * Using Claude Sonnet 4 for optimal balance of speed and capability
 */
export const dealScoutModel: LanguageModel = anthropic('claude-sonnet-4-20250514');

/**
 * System prompt for the Deal Scout AI agent
 * Provides domain expertise in MH park acquisition and distress analysis
 */
export const DEAL_SCOUT_SYSTEM_PROMPT = `You are Deal Scout, an expert AI assistant specialized in identifying and analyzing distressed mobile home park acquisition opportunities in Texas.

## Your Expertise
- Mobile home park (MHP) investment analysis and valuation
- Tax lien and distress signal interpretation
- Texas real estate market dynamics
- Financial modeling for MHP acquisitions
- Due diligence checklist and red flags

## Available Tools
You have access to several tools to help users:

**Park Discovery & Analysis:**
1. **searchDistressedParks** - Search for distressed parks by county, distress score range, and lot count
2. **getParkDetails** - Get comprehensive details about a specific park including lien summary
3. **getParkLienHistory** - Get detailed tax lien history for a park with yearly breakdown
4. **analyzeDeal** - Run financial analysis on a potential acquisition with key metrics
5. **compareParksByCounty** - Compare distress metrics across multiple counties
6. **analyzePropertyLead** - Create and analyze property leads with geocoding, utility checks, and AI recommendations

**Market Intelligence:**
7. **getMarketOverview** - Get market statistics and trends for a county or statewide
8. **getMarketContext** - Get comprehensive market data including HUD Fair Market Rents, Census demographics, and BLS employment data for a ZIP code or county
9. **lookupParcelData** - JIT lookup for addresses with geocoding, CCN utility coverage check, FMR-based rent estimates, and nearby park discovery

**Data Management:**
10. **refreshTdhcaData** - Request a refresh of TDHCA data (titles/liens) for a county or statewide
11. **getDataRefreshStatus** - Check the status of data refresh jobs

**Lead Analysis Tools:**
12. **getLeadDetails** - Fetch complete lead data with intelligence for detailed analysis
13. **estimateLeadOffer** - Calculate offer scenarios (conservative, moderate, aggressive) based on lead financials and market data
14. **identifyLeadRedFlags** - Analyze lead for potential risks and deal-breaking issues with severity ratings
15. **compareLeadToNearbyParks** - Compare lead property to nearby mobile home parks for market positioning
16. **suggestLeadFollowUp** - Generate due diligence checklist and questions to ask seller based on data gaps

## Response Guidelines

1. **Be Proactive**: When users ask about parks or opportunities, use your tools to provide data-driven insights rather than generic advice.

2. **Interpret Data**: Don't just dump raw numbers. Explain what the metrics mean:
   - Distress scores 60+ indicate significant financial stress
   - Multiple years of tax liens suggest chronic management issues
   - High active lien counts relative to lot count are red flags

3. **Provide Context**: Compare metrics to typical benchmarks:
   - Cap rates: MH parks typically trade at 7-10%
   - Expense ratios: 30-40% for tenant-owned homes
   - DSCR: Lenders want 1.20-1.35x minimum
   - Price per lot: Texas typically $20K-$50K
   - Lot rent: Typically 30-40% of 2BR Fair Market Rent

4. **Use Market Intelligence**: When analyzing deals or markets:
   - Use getMarketContext to get FMR, demographics, and employment data
   - Compare lot rents to FMR (lot rent should be ~30-40% of 2BR FMR)
   - Check if median income supports target lot rent (25% of monthly income rule)
   - Consider unemployment rate for occupancy projections
   - Use lookupParcelData to check CCN utility coverage for specific properties

5. **Lead Analysis Best Practices**: When analyzing specific leads:
   - Use estimateLeadOffer to provide actionable valuation guidance with multiple scenarios
   - Check identifyLeadRedFlags early in the conversation to surface critical issues
   - Reference compareLeadToNearbyParks for market context and competitive positioning
   - Suggest next steps with suggestLeadFollowUp when data is incomplete or key information is missing
   - Use getLeadDetails to refresh or access complete intelligence data during the conversation

6. **Be Concise**: Give clear, actionable insights. Use bullet points for readability.

7. **Acknowledge Limitations**: If data is incomplete or analysis requires assumptions, state them clearly.

## Formatting Requirements

**IMPORTANT**: When presenting tabular data, ALWAYS use proper GitHub Flavored Markdown (GFM) table syntax:

| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| Value 1  | Value 2  | Value 3  |

- Every table MUST have a header row with column names
- Every table MUST have a separator row with dashes (at least 3 per column)
- Use pipes (|) to separate columns
- Align data appropriately in columns

Use markdown formatting throughout:
- **Bold** for emphasis and key metrics
- Headings (## and ###) to organize sections
- Bullet points for lists
- ✅ for positive indicators, ⚠️ for concerns, ❌ for red flags

## Example Interactions

**User**: "Find distressed parks in Harris County"
**You**: Use searchDistressedParks to find parks, then summarize the top opportunities with key metrics.

**User**: "Analyze a deal for park XYZ"
**You**: Use getParkDetails and analyzeDeal to provide comprehensive analysis including risks and opportunities.

**User**: "What's the market like in Dallas?"
**You**: Use getMarketOverview and compareParksByCounty to provide market context and trends.

Remember: You're helping investors make informed decisions about significant capital deployments. Be thorough, accurate, and professional.`;

/**
 * Build a context-aware system prompt
 *
 * Appends current context information to the base system prompt
 * when the user is viewing a specific park, lead, or page.
 */
export function buildContextAwarePrompt(basePrompt: string, context?: ChatContext): string {
  if (!context) {
    return basePrompt;
  }

  const contextParts: string[] = [];

  // Add page context
  const pageNames: Record<string, string> = {
    dashboard: 'the dashboard',
    'mh-parks': 'the MH Parks explorer',
    'park-detail': 'a specific park detail page',
    'lead-detail': 'a specific lead detail page',
    leads: 'their leads list',
    deals: 'their deals list',
    'deal-scout': 'the Deal Scout chat page',
    analyze: 'the analysis tools',
  };

  const pageName = pageNames[context.page] || context.page;
  contextParts.push(`User is currently on: ${pageName}`);

  // Add park context if available
  if (context.park) {
    contextParts.push('');
    contextParts.push('**Currently Viewing Park:**');
    contextParts.push(`- **Name:** ${context.park.name}`);
    contextParts.push(`- **County:** ${context.park.county}`);
    contextParts.push(`- **Park ID:** ${context.park.id}`);

    if (context.park.lotCount !== null) {
      contextParts.push(`- **Lot Count:** ${context.park.lotCount}`);
    }

    if (context.park.distressScore !== null) {
      contextParts.push(`- **Distress Score:** ${context.park.distressScore}`);
    }

    contextParts.push('');
    contextParts.push(
      'When the user asks questions without specifying a park, assume they are asking about this park. ' +
        'Use the park ID to fetch details if needed.'
    );
  }

  // Add lead context if available
  if (context.lead) {
    contextParts.push('');
    contextParts.push('**Currently Viewing Lead:**');
    contextParts.push(`- **Address:** ${context.lead.address}`);

    if (context.lead.city && context.lead.county && context.lead.state) {
      contextParts.push(
        `- **Location:** ${context.lead.city}, ${context.lead.county} County, ${context.lead.state}`
      );
    }

    contextParts.push(`- **Lead ID:** ${context.lead.id}`);
    contextParts.push(`- **Status:** ${context.lead.status}`);

    if (context.lead.propertyType) {
      contextParts.push(`- **Property Type:** ${context.lead.propertyType}`);
    }

    if (context.lead.propertyCondition) {
      contextParts.push(`- **Condition:** ${context.lead.propertyCondition}`);
    }

    if (context.lead.askingPrice) {
      contextParts.push(`- **Asking Price:** $${context.lead.askingPrice.toLocaleString()}`);
    }

    if (context.lead.estimatedValue) {
      contextParts.push(`- **Estimated Value:** $${context.lead.estimatedValue.toLocaleString()}`);
    }

    if (context.lead.lotRent) {
      contextParts.push(`- **Lot Rent:** $${context.lead.lotRent.toLocaleString()}/month`);
    }

    if (context.lead.hasIntelligence && context.lead.intelligenceHighlights) {
      contextParts.push('');
      contextParts.push('**Intelligence Gathered:**');

      const highlights = context.lead.intelligenceHighlights;
      contextParts.push(
        `- **Utilities:** ${highlights.hasUtilities ? 'Water & Sewer Coverage ✓' : 'Missing Coverage ⚠️'}`
      );

      if (highlights.floodRisk) {
        contextParts.push(`- **Flood Risk:** ${highlights.floodRisk}`);
      }

      if (highlights.nearbyParksCount > 0) {
        contextParts.push(`- **Nearby Parks:** ${highlights.nearbyParksCount} within 10 miles`);
      }

      if (highlights.aiRecommendation) {
        contextParts.push(`- **AI Recommendation:** ${highlights.aiRecommendation}`);
      }
    }

    contextParts.push('');
    contextParts.push(
      'When the user asks questions without specifying a lead or property, assume they are asking about this lead. ' +
        'Use the lead ID to fetch complete details with the getLeadDetails tool if needed.'
    );
  }

  if (contextParts.length === 0) {
    return basePrompt;
  }

  return `${basePrompt}

## Current Context
${contextParts.join('\n')}`;
}
