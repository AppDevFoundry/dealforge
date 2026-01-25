/**
 * AI configuration for Deal Scout agent
 *
 * Configures Anthropic Claude model and system prompt for
 * distressed mobile home park acquisition analysis.
 */

import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

/**
 * Context passed from the chat panel for context-aware responses
 */
export interface ChatContext {
  page: string;
  park: {
    id: string;
    name: string;
    county: string;
    lotCount: number | null;
    distressScore: number | null;
  } | null;
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

1. **searchDistressedParks** - Search for distressed parks by county, distress score range, and lot count
2. **getParkDetails** - Get comprehensive details about a specific park including lien summary
3. **getParkLienHistory** - Get detailed tax lien history for a park with yearly breakdown
4. **analyzeDeal** - Run financial analysis on a potential acquisition with key metrics
5. **compareParksByCounty** - Compare distress metrics across multiple counties
6. **getMarketOverview** - Get market statistics and trends for a county or statewide
7. **refreshTdhcaData** - Request a refresh of TDHCA data (titles/liens) for a county or statewide
8. **getDataRefreshStatus** - Check the status of data refresh jobs

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

4. **Be Concise**: Give clear, actionable insights. Use bullet points for readability.

5. **Acknowledge Limitations**: If data is incomplete or analysis requires assumptions, state them clearly.

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
 * when the user is viewing a specific park or page.
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

  if (contextParts.length === 0) {
    return basePrompt;
  }

  return `${basePrompt}

## Current Context
${contextParts.join('\n')}`;
}
