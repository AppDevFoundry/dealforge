# DealForge: Current State Analysis & Next Steps

## Executive Summary

DealForge has a **solid foundation** already built. The architecture, database schema, API routes, UI components, and data ingestion scripts are all in place. What's needed now is to **actually run the data pipeline** and then **expose the distress intelligence** through the UI.

---

## What's Already Built

### Database Schema (Complete ✅)

| Table | Purpose | Status |
|-------|---------|--------|
| `mh_communities` | MH parks/communities | ✅ Schema exists |
| `mh_titlings` | Monthly titling stats by county | ✅ Schema exists |
| `mh_ownership_records` | TDHCA title/certificate records | ✅ Schema exists |
| `mh_tax_liens` | TDHCA tax lien records | ✅ Schema exists |
| `ccn_areas` | PUC water/sewer service boundaries | ✅ Schema exists (PostGIS) |
| `ccn_facilities` | PUC utility infrastructure lines | ✅ Schema exists (PostGIS) |
| `flood_zones` | FEMA flood hazard zones | ✅ Schema exists (PostGIS) |
| `texas_counties` | County reference data | ✅ Schema exists |
| `deals` | User deal analyses | ✅ Schema exists |

### Data Ingestion Scripts (Complete ✅)

| Script | Purpose | Command |
|--------|---------|---------|
| `sync-tdhca-titles.ts` | Import TDHCA ownership CSV | `pnpm sync:tdhca:titles <csv>` |
| `sync-tdhca-liens.ts` | Import TDHCA tax lien CSV | `pnpm sync:tdhca:liens <csv>` |
| `discover-parks.ts` | Cluster titles → detect parks | `pnpm discover:parks` |
| `sync-ccn-data.ts` | Import PUC CCN shapefiles | `pnpm sync:ccn <shapefile>` |
| `sync-flood-data.ts` | Import FEMA flood shapefiles | `pnpm sync:flood <shapefile>` |

### API Endpoints (Complete ✅)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| `GET /api/v1/mh-parks` | List parks with filters | ✅ Working |
| `GET /api/v1/mh-parks/:id` | Park detail | ✅ Working |
| `GET /api/v1/mh-parks/:id/tdhca` | Lien summary + title activity | ✅ Working |
| `GET /api/v1/mh-parks/stats` | Aggregate statistics | ✅ Working |
| `GET /api/v1/mh-parks/titlings` | Titling trends | ✅ Working |
| `GET /api/v1/infrastructure/ccn` | CCN areas by bbox | ✅ Working |
| `GET /api/v1/infrastructure/facilities` | CCN lines by bbox | ✅ Working |
| `GET /api/v1/infrastructure/flood-zones` | Flood zones by bbox | ✅ Working |
| `GET /api/v1/infrastructure/check-point` | Infrastructure at point | ✅ Working |

### UI Components (Complete ✅)

| Component | Purpose | Status |
|-----------|---------|--------|
| Interactive Map | Park pins + infrastructure layers | ✅ Working |
| Park Search | Filters, pagination, CSV export | ✅ Working |
| Park Detail Page | Header, info grid, lien panel, titles table | ✅ Working |
| Market Dashboard | Titling trends, county comparison | ✅ Working |
| Layer Controls | Toggle CCN/flood/facilities | ✅ Working |

### Backend Query Functions (Complete ✅)

| Function | Purpose | Status |
|----------|---------|--------|
| `getTaxLienSummaryForPark()` | Lien stats for a park | ✅ Implemented |
| `getTitleActivityForPark()` | Recent title transactions | ✅ Implemented |
| `getDistressedParks()` | Parks ranked by lien concentration | ✅ Implemented but **NOT exposed via API** |

---

## What's Missing / Not Wired Up

### 1. **Data Not Loaded** (Critical Gap)

The scripts exist but it appears the actual TDHCA data has not been downloaded and ingested:
- Need to download ownership records CSV from TDHCA MHWeb
- Need to download tax lien records CSV from TDHCA MHWeb
- Need to run `discover:parks` to cluster titles into communities
- Need to download and import PUC CCN shapefiles
- Need to download and import FEMA flood shapefiles

### 2. **Distressed Parks API Not Exposed** (High Value Gap)

`getDistressedParks()` query function exists in `/lib/tdhca/queries.ts` but:
- ❌ No API endpoint exposes this
- ❌ No UI shows distressed parks ranking
- ❌ No distress score stored on `mh_communities` table

This is the **highest-value missing feature** for your deal-finding use case.

### 3. **Park Geocoding Not Implemented**

The `discover-parks.ts` script creates parks but doesn't geocode them:
- Parks discovered from TDHCA data won't have `latitude`/`longitude`
- They won't appear on the map until geocoded

### 4. **Distress Score Not Calculated/Stored**

The vision document mentions a "distress score" but:
- ❌ No field for distress score in `mh_communities` schema
- ❌ No calculation logic for distress score
- ❌ Parks not color-coded by distress on map

### 5. **AI Features Not Started**

- ❌ No Deal Scout AI
- ❌ No Parcel Analysis AI
- ❌ No Due Diligence Assistant

---

## Recommended Next Step: Distressed Parks Intelligence

The highest-impact next feature is to:

1. **Add a distress score field** to `mh_communities`
2. **Create API endpoint** for distressed parks ranking
3. **Build UI component** showing distressed parks
4. **Add distress color-coding** to map pins

This directly enables the core use case: *"surface deals faster"*

---

## Gap Summary Table

| Area | What Exists | What's Missing |
|------|-------------|----------------|
| **Data** | Ingestion scripts | Actual data loaded |
| **Distress Detection** | Query function | API endpoint, UI, stored score |
| **Geocoding** | Address normalization | Batch geocoding for discovered parks |
| **Map Visualization** | Park pins, layers | Distress-based pin coloring |
| **AI Intelligence** | Nothing | Deal Scout, Parcel Analysis |

---

# Coding Agent Prompt

Use the prompt below to have a coding agent implement the next step.

---

## Prompt: Implement Distressed Parks Intelligence Feature

### Context

You are working on DealForge, a Texas mobile home park investment intelligence platform. The codebase is a Next.js 15 monorepo with:
- `/apps/web` - Next.js app with App Router
- `/packages/database` - Drizzle ORM schema and scripts
- `/packages/types` - Shared TypeScript types

The database uses Neon Postgres with PostGIS. TDHCA data (ownership records, tax liens) exists in the database and there's already a query function `getDistressedParks()` in `/apps/web/lib/tdhca/queries.ts` that ranks parks by lien concentration.

### Your Task

Implement the "Distressed Parks Intelligence" feature to surface acquisition opportunities based on tax lien data.

### Requirements

#### 1. Database Schema Update

Add a `distress_score` column to the `mh_communities` table:

```typescript
// In packages/database/src/schema/mh-parks.ts
// Add to mhCommunities table:
distressScore: real('distress_score'), // 0-100 score
distressUpdatedAt: timestamp('distress_updated_at', { withTimezone: true }),
```

Run `pnpm db:generate` and `pnpm db:push` to apply.

#### 2. Create Distress Score Calculation Script

Create `/packages/database/src/scripts/calculate-distress-scores.ts`:

```
Distress Score Formula (0-100):
- 40% weight: Percentage of homes with active tax liens
- 30% weight: Total tax amount owed relative to estimated park value
- 20% weight: Recency of liens (more recent = higher distress)
- 10% weight: Multiple tax years with liens (chronic issues)

Higher score = more distressed = better acquisition target
```

The script should:
- Query all parks in `mh_communities`
- For each park, query matching liens from `mh_tax_liens` by address/city
- Calculate distress score using the formula above
- Update `distress_score` and `distress_updated_at` on the park record
- Log progress and summary stats

Add npm script: `"calculate:distress": "tsx src/scripts/calculate-distress-scores.ts"`

#### 3. Create API Endpoint

Create `/apps/web/app/api/v1/mh-parks/distressed/route.ts`:

```typescript
// GET /api/v1/mh-parks/distressed
// Query params:
//   - county (optional): Filter by county
//   - minScore (optional): Minimum distress score (default 20)
//   - limit (optional): Max results (default 25, max 100)
//   - sortBy (optional): 'score' | 'lienCount' | 'taxOwed' (default 'score')

// Response: Array of distressed parks with:
//   - id, name, address, city, county
//   - lotCount, distressScore
//   - activeLienCount, totalTaxOwed
//   - latitude, longitude (for map display)
```

#### 4. Create React Hook

Create `/apps/web/lib/hooks/use-distressed-parks.ts`:

```typescript
export function useDistressedParks(options?: {
  county?: string;
  minScore?: number;
  limit?: number;
}) {
  // Use React Query to fetch from /api/v1/mh-parks/distressed
  // Return { data, isLoading, error }
}
```

#### 5. Create UI Components

##### 5a. Distressed Parks Table Component

Create `/apps/web/components/mh-parks/distress/distressed-parks-table.tsx`:

- Sortable table showing distressed parks
- Columns: Park Name, City, County, Lots, Distress Score, Active Liens, Tax Owed
- Click row to navigate to park detail page
- Color-code distress score (red > 70, orange 40-70, yellow 20-40)

##### 5b. Distressed Parks Page

Create `/apps/web/app/(dashboard)/mh-parks/distressed/page.tsx`:

- Page title: "Distressed Parks" with description
- County filter dropdown
- Min score slider (0-100)
- Distressed parks table
- Export to CSV button

##### 5c. Add Navigation

Update the MH Parks navigation/sidebar to include link to "/mh-parks/distressed"

#### 6. Map Pin Color Coding (Optional Enhancement)

Update `/apps/web/components/mh-parks/map/mh-park-map.tsx`:
- Color park pins by distress score if available
- Red pins = high distress (>70)
- Orange pins = medium distress (40-70)
- Yellow pins = low distress (20-40)
- Default blue = no distress data

### File Structure

```
apps/web/
├── app/
│   ├── api/v1/mh-parks/
│   │   └── distressed/
│   │       └── route.ts          # NEW: Distressed parks API
│   └── (dashboard)/mh-parks/
│       └── distressed/
│           ├── page.tsx          # NEW: Distressed parks page
│           └── loading.tsx       # NEW: Loading state
├── components/mh-parks/
│   └── distress/
│       ├── distressed-parks-table.tsx  # NEW
│       └── distress-score-badge.tsx    # NEW: Score display component
└── lib/hooks/
    └── use-distressed-parks.ts   # NEW

packages/database/
├── src/schema/
│   └── mh-parks.ts               # MODIFY: Add distress_score column
└── src/scripts/
    └── calculate-distress-scores.ts  # NEW
```

### Technical Notes

1. **Neon/Drizzle**: Use `@neondatabase/serverless` for raw SQL in scripts, Drizzle for schema
2. **API Response Format**: Follow existing pattern with `createSuccessResponse()` from `/lib/api.ts`
3. **React Query**: Follow existing patterns in `use-mh-parks.ts`
4. **UI Components**: Use shadcn/ui components from `/components/ui/`
5. **Types**: Export new types from `/packages/types/src/`

### Acceptance Criteria

- [ ] `distress_score` column exists on `mh_communities` table
- [ ] Script calculates and stores distress scores for all parks
- [ ] API endpoint returns distressed parks sorted by score
- [ ] UI page shows filterable, sortable table of distressed parks
- [ ] Can navigate from distressed parks list to individual park detail
- [ ] Distress scores visible in park detail view
- [ ] (Bonus) Map pins colored by distress level

### Testing

After implementation:
1. Run `pnpm calculate:distress` to populate scores
2. Visit `/mh-parks/distressed` to see ranked parks
3. Click a park to verify navigation works
4. Try filtering by county and adjusting min score
5. Export CSV and verify data

---

*This prompt provides everything a coding agent needs to implement the distressed parks intelligence feature.*
