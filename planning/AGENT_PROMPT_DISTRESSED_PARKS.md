# Agent Prompt: Implement Distressed Parks Feature

## Task

Implement the "Distressed Parks Intelligence" feature for DealForge, a Texas mobile home park investment platform. This feature surfaces acquisition opportunities by ranking parks based on tax lien distress signals.

## Specification Document

Read the full specification in `/NEXT_STEPS_TDHCA_DATA_INGESTION.md` - the "Coding Agent Prompt" section contains all requirements, file structure, and acceptance criteria.

## Summary of Deliverables

1. **Schema**: Add `distress_score` column to `mh_communities` table
2. **Script**: Create `calculate-distress-scores.ts` to compute and store scores
3. **API**: Create `GET /api/v1/mh-parks/distressed` endpoint
4. **Hook**: Create `useDistressedParks()` React Query hook
5. **UI**: Create distressed parks page at `/mh-parks/distressed` with sortable table
6. **Nav**: Add link to distressed parks in MH Parks navigation

## Key Files to Reference

- Schema: `packages/database/src/schema/mh-parks.ts`
- Existing queries: `apps/web/lib/tdhca/queries.ts` (see `getDistressedParks()`)
- API patterns: `apps/web/app/api/v1/mh-parks/route.ts`
- Hook patterns: `apps/web/lib/hooks/use-mh-parks.ts`
- UI patterns: `apps/web/app/(dashboard)/mh-parks/page.tsx`

## Start

Begin by reading the spec document, then implement each deliverable in order. Run `pnpm db:generate && pnpm db:push` after schema changes.
