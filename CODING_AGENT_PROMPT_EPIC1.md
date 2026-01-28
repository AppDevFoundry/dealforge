# Coding Agent Prompt: Epic 1 - Lead Intelligence & Due Diligence Reports

## Initial Prompt

```
You are implementing a "Lead Intelligence" feature for DealForge, a Texas mobile home deal intelligence platform built with Next.js 14 (App Router), PostgreSQL/PostGIS (Neon + Drizzle ORM), and Vercel AI SDK.

## Your Task

Implement the Lead Intelligence & Due Diligence Reports feature that allows users to:
1. Submit property leads via a multi-step form
2. Automatically gather intelligence (geocoding, CCN utility coverage, market data, nearby parks, AI analysis)
3. View comprehensive lead details with gathered intelligence
4. Generate professional PDF due diligence reports

## Implementation Plan

Read the detailed implementation plan at:
`/IMPLEMENTATION_PLAN_EPIC1_LEAD_INTELLIGENCE.md`

This document contains:
- Complete database schema (copy-paste ready)
- Component implementations with code samples
- Server actions and intelligence gathering service
- PDF report template using @react-pdf/renderer
- AI tool integration for Deal Scout

## Implementation Order

1. Database schema (`packages/database/src/schema/leads.ts`)
2. Server actions (`apps/web/lib/leads/actions.ts`)
3. Intelligence service (`apps/web/lib/leads/intelligence.ts`)
4. Lead intake form (`apps/web/components/leads/lead-intake-form.tsx`)
5. Lead pages (`apps/web/app/(dashboard)/leads/...`)
6. PDF report generator (`apps/web/lib/reports/...`)
7. AI tool (`apps/web/lib/ai/tools/analyze-property-lead.ts`)

## Key Integration Points

- Existing `lookupParcelData` tool shows the pattern for CCN checks and geocoding
- Existing schema files in `packages/database/src/schema/` show conventions
- Existing AI tools in `apps/web/lib/ai/tools/` show tool patterns
- Use shadcn/ui components (already installed)

## Environment

The project already has these configured:
- MAPBOX_ACCESS_TOKEN (for geocoding)
- OPENAI_API_KEY (for AI analysis)
- DATABASE_URL (Neon PostgreSQL with PostGIS)

## First Step

Start by reading the implementation plan, then create the database schema and run migrations:

```bash
cd packages/database
pnpm db:generate
pnpm db:push
```

Ask questions if anything in the implementation plan is unclear.
```

---

## Shorter Version (if needed)

```
Implement the Lead Intelligence feature for DealForge (Next.js 14, PostgreSQL/PostGIS, Vercel AI SDK).

Read the detailed implementation plan at `/IMPLEMENTATION_PLAN_EPIC1_LEAD_INTELLIGENCE.md` which contains complete code samples and specifications.

The feature allows users to submit property leads, automatically gathers intelligence (geocoding, utility coverage, market data, AI analysis), and generates PDF due diligence reports.

Start with the database schema in `packages/database/src/schema/leads.ts`, then follow the implementation order in the plan.
```
