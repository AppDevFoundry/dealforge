# AI Deal Scout Agent - Implementation Plan

## Overview

Integrate Vercel AI SDK to create a conversational AI agent ("Deal Scout") that helps users discover and analyze distressed mobile home park acquisition opportunities. The agent will have access to tools for searching parks, retrieving details, and running financial analysis.

---

## Phase 1: Vercel AI SDK Setup

### 1.1 Install Dependencies

```bash
pnpm add ai @ai-sdk/anthropic zod
```

### 1.2 Environment Configuration

**File:** `.env.local`

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### 1.3 AI SDK Configuration

**New File:** `apps/web/lib/ai/config.ts`

```typescript
import { createAnthropic } from '@ai-sdk/anthropic';

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const model = anthropic('claude-sonnet-4-20250514');
```

---

## Phase 2: Tool Definitions

### 2.1 Tool Schema

**New File:** `apps/web/lib/ai/tools/index.ts`

Define tools using Zod schemas for type-safe parameters:

| Tool | Description | Parameters |
|------|-------------|------------|
| `searchDistressedParks` | Search for distressed parks by criteria | `county?`, `minScore?`, `maxScore?`, `minLots?`, `maxLots?`, `limit?` |
| `getParkDetails` | Get detailed info about a specific park | `parkId` |
| `getParkLienHistory` | Get tax lien history for a park | `parkId` |
| `analyzeDeal` | Run financial analysis on a potential acquisition | `parkId`, `purchasePrice`, `downPaymentPercent?`, `interestRate?`, `loanTermYears?` |
| `compareParksByCounty` | Compare distress metrics across counties | `counties[]` |
| `getMarketOverview` | Get summary statistics for a market/county | `county` |

### 2.2 Tool Implementations

**New Files:**
- `apps/web/lib/ai/tools/search-distressed-parks.ts`
- `apps/web/lib/ai/tools/get-park-details.ts`
- `apps/web/lib/ai/tools/get-park-lien-history.ts`
- `apps/web/lib/ai/tools/analyze-deal.ts`
- `apps/web/lib/ai/tools/compare-parks.ts`
- `apps/web/lib/ai/tools/get-market-overview.ts`

Each tool:
1. Validates input with Zod
2. Queries database or calls existing APIs
3. Returns structured data for the LLM to interpret

### 2.3 Example Tool Implementation

```typescript
// search-distressed-parks.ts
import { z } from 'zod';
import { tool } from 'ai';
import { neon } from '@neondatabase/serverless';

export const searchDistressedParks = tool({
  description: 'Search for distressed mobile home parks by various criteria including county, distress score range, and lot count',
  parameters: z.object({
    county: z.string().optional().describe('Texas county name to filter by'),
    minScore: z.number().min(0).max(100).optional().describe('Minimum distress score (0-100)'),
    maxScore: z.number().min(0).max(100).optional().describe('Maximum distress score (0-100)'),
    minLots: z.number().optional().describe('Minimum number of lots'),
    maxLots: z.number().optional().describe('Maximum number of lots'),
    limit: z.number().max(20).optional().default(10).describe('Max results to return'),
  }),
  execute: async ({ county, minScore = 20, maxScore = 100, minLots, maxLots, limit = 10 }) => {
    const sql = neon(process.env.DATABASE_URL!);
    // Query implementation...
    return { parks, totalCount, filters: { county, minScore, maxScore } };
  },
});
```

---

## Phase 3: Chat API Route

**New File:** `apps/web/app/api/chat/route.ts`

```typescript
import { streamText } from 'ai';
import { model } from '@/lib/ai/config';
import { tools } from '@/lib/ai/tools';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model,
    system: `You are Deal Scout, an AI assistant specializing in mobile home park acquisitions in Texas.

You help investors identify distressed properties by analyzing tax lien data, ownership records, and market conditions.

When users ask about finding deals:
1. Use searchDistressedParks to find candidates
2. Use getParkDetails for deeper analysis
3. Use analyzeDeal to run financial projections

Be concise and data-driven. Always cite specific numbers from the tools.`,
    messages,
    tools,
    maxSteps: 5, // Allow multi-step tool use
  });

  return result.toDataStreamResponse();
}
```

---

## Phase 4: Chat UI Components

### 4.1 Chat Message Component

**New File:** `apps/web/components/ai/chat-message.tsx`

- User message styling (right-aligned, blue)
- Assistant message styling (left-aligned, gray)
- Tool invocation display (collapsible, shows parameters)
- Tool result display (formatted data tables/cards)

### 4.2 Chat Input Component

**New File:** `apps/web/components/ai/chat-input.tsx`

- Text input with send button
- Loading state during streaming
- Suggested prompts/quick actions

### 4.3 Deal Scout Chat Panel

**New File:** `apps/web/components/ai/deal-scout-chat.tsx`

```typescript
'use client';

import { useChat } from 'ai/react';
import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';

export function DealScoutChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <ChatInput
        input={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
```

### 4.4 Component Index

**New File:** `apps/web/components/ai/index.ts`

---

## Phase 5: Chat Page & Navigation

### 5.1 Deal Scout Page

**New File:** `apps/web/app/(dashboard)/deal-scout/page.tsx`

Layout options:
- **Option A:** Full-page chat interface
- **Option B:** Split view - chat on left, map/results on right

Recommended: Start with Option A, iterate to Option B.

```typescript
import { DealScoutChat } from '@/components/ai/deal-scout-chat';

export default function DealScoutPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <DealScoutChat />
    </div>
  );
}
```

### 5.2 Navigation Update

**File:** `apps/web/components/layout/app-sidebar.tsx`

Add new top-level nav item:

```typescript
{
  title: 'Deal Scout',
  href: '/deal-scout',
  icon: Bot, // from lucide-react
}
```

---

## Phase 6: Context-Aware Chat (Enhancement)

### 6.1 Page Context Injection

Allow the chat to receive context from the current page:

```typescript
// On park detail page
const { messages, ... } = useChat({
  api: '/api/chat',
  body: {
    context: {
      currentParkId: parkId,
      currentPage: 'park-detail',
    },
  },
});
```

### 6.2 Floating Chat Button

**New File:** `apps/web/components/ai/chat-fab.tsx`

- Floating action button (bottom-right)
- Opens chat in a slide-out panel
- Persists across page navigation
- Pre-populates context from current page

---

## Phase 7: TDHCA Data Automation Tool (Future)

### Overview

The TDHCA (Texas Department of Housing and Community Affairs) provides tax lien and title data through their data portal. Currently this requires manual CSV downloads. This could become an AI-callable tool.

### Current Manual Process

1. Navigate to TDHCA data portal
2. Select data type (tax liens or titles)
3. Apply filters (date range, county, etc.)
4. Download CSV
5. Run sync script (`sync:tdhca:liens` or `sync:tdhca:titles`)

### Automation Approach

**New Tool:** `refreshTDHCAData`

```typescript
export const refreshTDHCAData = tool({
  description: 'Trigger a refresh of TDHCA tax lien and title data. This launches a background job that scrapes the latest data from TDHCA portal.',
  parameters: z.object({
    dataType: z.enum(['liens', 'titles', 'both']).describe('Which data to refresh'),
    county: z.string().optional().describe('Specific county to refresh, or all if omitted'),
  }),
  execute: async ({ dataType, county }) => {
    // Option 1: Trigger a background job (recommended)
    // - Queue a job that runs Playwright script
    // - Return job ID for status checking

    // Option 2: Direct execution (simpler but slower)
    // - Run Playwright inline (risky for timeouts)

    return {
      status: 'queued',
      jobId: 'job_123',
      estimatedTime: '5-10 minutes',
      message: 'Data refresh has been queued. I will notify you when complete.'
    };
  },
});
```

### Implementation Components

1. **Playwright Script:** `packages/database/src/scripts/scrape-tdhca.ts`
   - Headless browser navigation to TDHCA portal
   - Download CSV to temp directory
   - Trigger existing sync scripts

2. **Job Queue:** Use Vercel Cron or external queue (Trigger.dev, Inngest)
   - Scheduled daily/weekly refresh
   - On-demand refresh via AI tool

3. **Status Tracking:**
   - Store job status in database
   - `getDataRefreshStatus` tool to check progress

### Separate Plan Document

A detailed implementation plan for TDHCA automation will be created in `PLAN_TDHCA_AUTOMATION.md` after the AI Deal Scout is functional. The automation is lower priority because:
- Data updates infrequently (monthly at most)
- Manual process works for now
- AI agent provides more immediate user value

---

## Example User Interactions

### Discovery Flow

```
User: Find me distressed parks in Harris County with at least 50 lots

Agent: [calls searchDistressedParks]

I found 3 distressed parks in Harris County with 50+ lots:

1. **Sunset Mobile Home Park** - 72 lots, Distress Score: 67
   - 12 active liens totaling $45,230
   - Most recent lien: 2 months ago

2. **Pine Valley MHC** - 58 lots, Distress Score: 54
   - 8 active liens totaling $28,100
   - Most recent lien: 5 months ago

3. **Lakeside Estates** - 51 lots, Distress Score: 41
   - 5 active liens totaling $15,800
   - Most recent lien: 8 months ago

Would you like me to dive deeper into any of these?
```

### Analysis Flow

```
User: Tell me more about Sunset Mobile Home Park

Agent: [calls getParkDetails, getParkLienHistory]

**Sunset Mobile Home Park**
📍 1234 Sunset Blvd, Houston, TX 77001 (Harris County)

| Metric | Value |
|--------|-------|
| Lots | 72 |
| Distress Score | 67/100 (Medium-High) |
| Active Liens | 12 |
| Total Tax Owed | $45,230 |

**Lien History:**
- 2024: 8 new liens ($32,400)
- 2023: 6 liens ($18,200)
- 2022: 3 liens ($8,100)

**Red Flags:**
- Lien activity increasing year-over-year
- Multiple consecutive years with liens (chronic issues)
- Recent liens suggest ongoing financial distress

**Utility Infrastructure:**
- Water: Municipal (City of Houston)
- Sewer: Municipal

Would you like me to run a deal analysis with some assumptions?
```

### Deal Analysis Flow

```
User: Run a deal analysis assuming $1.2M purchase price

Agent: [calls analyzeDeal]

**Deal Analysis: Sunset Mobile Home Park @ $1.2M**

| Assumption | Value |
|------------|-------|
| Purchase Price | $1,200,000 |
| Down Payment (25%) | $300,000 |
| Loan Amount | $900,000 |
| Interest Rate | 7.5% |
| Loan Term | 20 years |

**Monthly Cash Flow Projection:**

| Item | Amount |
|------|--------|
| Lot Rent Income (72 × $450) | $32,400 |
| Vacancy (10%) | -$3,240 |
| Effective Gross Income | $29,160 |
| Operating Expenses (40%) | -$11,664 |
| NOI | $17,496 |
| Debt Service | -$7,241 |
| **Cash Flow** | **$10,255** |

**Returns:**
- Cap Rate: 17.5%
- Cash-on-Cash: 41.0%
- Price per Lot: $16,667

⚠️ **Note:** This property has $45,230 in tax liens. Factor this into negotiations - you may be able to acquire at a discount or negotiate lien payoff as part of the deal.
```

---

## File Summary

| Action | File Path |
|--------|-----------|
| CREATE | `apps/web/lib/ai/config.ts` |
| CREATE | `apps/web/lib/ai/tools/index.ts` |
| CREATE | `apps/web/lib/ai/tools/search-distressed-parks.ts` |
| CREATE | `apps/web/lib/ai/tools/get-park-details.ts` |
| CREATE | `apps/web/lib/ai/tools/get-park-lien-history.ts` |
| CREATE | `apps/web/lib/ai/tools/analyze-deal.ts` |
| CREATE | `apps/web/lib/ai/tools/compare-parks.ts` |
| CREATE | `apps/web/lib/ai/tools/get-market-overview.ts` |
| CREATE | `apps/web/app/api/chat/route.ts` |
| CREATE | `apps/web/components/ai/chat-message.tsx` |
| CREATE | `apps/web/components/ai/chat-input.tsx` |
| CREATE | `apps/web/components/ai/deal-scout-chat.tsx` |
| CREATE | `apps/web/components/ai/index.ts` |
| CREATE | `apps/web/app/(dashboard)/deal-scout/page.tsx` |
| MODIFY | `apps/web/components/layout/app-sidebar.tsx` |

---

## Verification Steps

1. **Setup:** Install dependencies, add `ANTHROPIC_API_KEY` to `.env.local`
2. **API:** Test `/api/chat` with curl or Postman
3. **Tools:** Verify each tool returns expected data format
4. **UI:** Visit `/deal-scout`, test conversation flows
5. **Context:** Test chat from park detail page includes park context
6. **Navigation:** Verify "Deal Scout" appears in sidebar

---

## Future Enhancements

1. **Conversation History:** Persist chat history per user in database
2. **Saved Searches:** Allow users to save and re-run queries
3. **Alerts:** "Notify me when new distressed parks appear in Harris County"
4. **Multi-modal:** Support image uploads (property photos, documents)
5. **TDHCA Integration:** Add `refreshTDHCAData` tool (see Phase 7)
6. **Export:** "Generate a PDF report for this park"

---

## Dependencies on Existing Features

This plan builds on:
- ✅ Distressed parks scoring (`distress_score` column)
- ✅ Tax lien data (`mh_tax_liens` table)
- ✅ Park details API (`/api/v1/mh-parks/[id]`)
- ✅ WASM calculator (`@dealforge/calc-engine-wasm`)
- ✅ Existing database queries and types