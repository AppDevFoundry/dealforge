# Coding Agent Prompt: Epic 1 Continuation - Lead Intelligence

**Date:** January 2026
**Status:** ~90% Complete - Needs Polish

---

## Context

Epic 1 (Lead Intelligence & Due Diligence Reports) is approximately 90% complete. The core feature is working but needs a few enhancements to match the original implementation plan.

## Reference Documents

- Full implementation plan: `/IMPLEMENTATION_PLAN_EPIC1_LEAD_INTELLIGENCE.md`
- Original planning doc: `/NEXT_EPICS_PLANNING.md`

---

## Initial Prompt

```
Continue implementing Epic 1 (Lead Intelligence) for DealForge. The core feature is ~90% complete.

**Reference:** `/IMPLEMENTATION_PLAN_EPIC1_LEAD_INTELLIGENCE.md`

**Remaining tasks:**

1. **Add map view to lead detail page** (`/leads/[leadId]`)
   - Show property location marker centered on the geocoded coordinates
   - Display nearby MH parks as markers (data already gathered in intelligence)
   - Use existing Mapbox setup (see `/mh-parks` pages for reference)
   - Consider using the existing map components if available

2. **Add property features to intake form**
   - Add a 5th step OR expand the property step to include feature checkboxes:
     - RV hookups
     - Storage building
     - Garage
     - Carport
     - Septic system
     - Well water
     - Central A/C
     - Currently occupied
     - Needs to be moved
   - The `features` JSONB field already exists in the leads schema but isn't used in the form
   - See the schema in `packages/database/src/schema/leads.ts`

3. **Add lead edit functionality**
   - Currently users can only create leads, not edit them after creation
   - Add an edit page at `/leads/[leadId]/edit` or use a modal
   - Reuse the intake form components with pre-populated values
   - Add an "Edit" button to the lead detail page

4. **Write tests** for:
   - Intelligence gathering service (`apps/web/lib/leads/intelligence.ts`)
   - Lead API routes (`apps/web/app/api/v1/leads/...`)
   - Key React components (intake form, lead card)

**Existing code to reference:**
- Lead detail page: `apps/web/app/(dashboard)/leads/[leadId]/page.tsx`
- Lead intake form: `apps/web/components/leads/lead-intake-form.tsx`
- Intake step components: `apps/web/components/leads/lead-intake-steps/`
- Intelligence service: `apps/web/lib/leads/intelligence.ts`
- Shared utilities: `apps/web/lib/shared/` (geocoding, ccn-coverage, fmr-lookup, etc.)
- Map implementation example: `apps/web/app/(dashboard)/mh-parks/page.tsx`
- Types: `packages/types/src/leads.ts`

**Tech stack:**
- Next.js 14 (App Router)
- PostgreSQL/PostGIS (Neon) with Drizzle ORM
- Mapbox GL JS for maps
- shadcn/ui components
- Vercel AI SDK
- @react-pdf/renderer for reports
```

---

## What's Already Implemented

| Component | Location | Status |
|-----------|----------|--------|
| Database schema | `packages/database/src/schema/leads.ts` | ✅ Complete |
| Types | `packages/types/src/leads.ts` | ✅ Complete |
| AI tool (analyzePropertyLead) | `apps/web/lib/ai/tools/analyze-property-lead.ts` | ✅ Complete |
| Intelligence service | `apps/web/lib/leads/intelligence.ts` | ✅ Complete |
| Shared utilities | `apps/web/lib/shared/` | ✅ Complete (7 modules) |
| Lead intake form | `apps/web/components/leads/lead-intake-form.tsx` | ✅ 4 steps working |
| Lead list page | `apps/web/app/(dashboard)/leads/page.tsx` | ✅ Complete |
| Lead detail page | `apps/web/app/(dashboard)/leads/[leadId]/page.tsx` | ✅ Complete (needs map) |
| New lead page | `apps/web/app/(dashboard)/leads/new/page.tsx` | ✅ Complete |
| API routes | `apps/web/app/api/v1/leads/` | ✅ Complete |
| PDF report template | `apps/web/lib/reports/templates/due-diligence.tsx` | ✅ Complete |
| Report download | `apps/web/app/api/v1/leads/[leadId]/report/download/route.ts` | ✅ Complete |
| React hooks | `apps/web/hooks/use-leads.ts` | ✅ Complete |
| Navigation | `apps/web/components/layout/app-sidebar.tsx` | ✅ Leads in sidebar |

---

## Task Priority

1. **Map view** - High value, improves UX significantly
2. **Property features** - Medium value, captures more lead data
3. **Edit functionality** - Medium value, expected feature
4. **Tests** - Important for maintainability

---

## Notes

- The `features` field in the leads schema is a JSONB field that can store:
  ```typescript
  features: {
    hasRvHookups?: boolean;
    hasStorageBuilding?: boolean;
    hasGarage?: boolean;
    hasCarport?: boolean;
    hasSeptic?: boolean;
    hasWell?: boolean;
    hasCentralAc?: boolean;
    isOccupied?: boolean;
    needsToBeMoved?: boolean;
  }
  ```

- The nearby parks data is already gathered during intelligence gathering and stored in `leadIntelligence.nearbyParks` - just needs to be displayed on a map.

- For the map, consider creating a reusable `LeadMap` component that can be used on both the detail page and potentially a full-screen map view.
