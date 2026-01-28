# Implementation Prompt: Market Intelligence & Dynamic UI

## Context

You are implementing new features for DealForge, a Texas mobile home park intelligence platform. The codebase is a monorepo with:

- **apps/web**: Next.js 15 app with Vercel AI SDK, shadcn/ui, Tailwind
- **packages/database**: Drizzle ORM with Neon Postgres + PostGIS
- **services/data-sync**: Go service skeleton for data synchronization

The AI Deal Scout chat agent already exists with 8 tools for searching distressed parks, analyzing deals, and viewing lien history. We're extending it with market intelligence data and dynamic UI rendering.

## Reference Document

Read `PLAN_MARKET_INTELLIGENCE_V2.md` for the complete implementation plan with code examples, schemas, and architecture details.

---

## ⚠️ Database Migration Strategy (IMPORTANT)

### Why Migrations Only

We use **migrations only** (`db:migrate`) instead of `db:push` because:

1. **PostGIS Compatibility** - Drizzle's `db:push` can interfere with PostGIS extensions and spatial settings on Neon. Migrations give us full control over what SQL runs.
2. **Production Safety** - Migrations are reviewable, versioned, and reversible.
3. **Branch Management** - Neon branches work cleanly with migration-based workflows.

### Database Workflow

```bash
# 1. After creating/modifying schema files, generate a migration:
pnpm db:generate

# 2. Review the generated SQL in packages/database/drizzle/
#    - Ensure it doesn't drop/recreate PostGIS-dependent columns
#    - Verify GEOGRAPHY columns use correct syntax

# 3. Apply migration to database:
pnpm db:migrate

# ❌ NEVER use db:push - it can break PostGIS settings
```

### PostGIS Considerations

When creating tables with spatial columns:

```typescript
// In schema files, use sql template for GEOGRAPHY columns
import { sql } from 'drizzle-orm';

export const myTable = pgTable('my_table', {
  // ... other columns
  location: geography('location', { type: 'point', srid: 4326 }),
  boundary: geography('boundary', { type: 'polygon', srid: 4326 }),
});
```

If Drizzle generates incorrect migration SQL for GEOGRAPHY columns, manually edit the migration file before running `db:migrate`.

### Seed Data Strategy

Once initial data is loaded from APIs (HUD, Census, BLS, TDHCA), create a seed file:

```bash
# Location: packages/database/src/seed/
# - seed-market-data.ts    # HUD, Census, BLS reference data
# - seed-texas-counties.ts # County FIPS codes, regions
# - seed-sample-parks.ts   # Sample MH parks for development

# Run seed (after migrations):
pnpm db:seed
```

The seed workflow:
1. Run data sync to populate real data from APIs
2. Export representative sample to seed files
3. Use seed files to quickly reset dev databases

---

## Implementation Tasks

### Phase 1: Database Schema (Start Here)

Add market data tables to `packages/database/src/schema/`:

1. Create `market-data.ts` with three tables:
   - `hud_fair_market_rents` - HUD FMR data by ZIP code
   - `census_demographics` - Census ACS data by county
   - `bls_employment` - BLS employment data by county

2. Export from `packages/database/src/schema/index.ts`

3. Generate and apply migration:
   ```bash
   pnpm db:generate
   # Review generated SQL in packages/database/drizzle/
   pnpm db:migrate
   ```

4. Verify tables created correctly:
   ```bash
   # Connect to Neon and check
   psql $DATABASE_URL -c "\d hud_fair_market_rents"
   ```

### Phase 2: Go Data Sync Service

Expand `services/data-sync/` to fetch from government APIs:

1. Implement `internal/config/config.go` for environment variables
2. Implement `internal/db/postgres.go` for database connection
3. Implement API clients in `internal/sources/`:
   - `hud/client.go` - HUD Fair Market Rent API
   - `census/client.go` - Census ACS API
   - `bls/client.go` - BLS API
4. Implement `internal/sync/orchestrator.go` to coordinate syncs
5. Update `cmd/sync/main.go` entry point
6. Create `.github/workflows/data-sync.yml` for scheduled execution

### Phase 3: New AI Tools

Add two tools to `apps/web/lib/ai/tools/`:

1. `get-market-context.ts` - Fetches HUD, Census, BLS data for a location
2. `lookup-parcel-data.ts` - JIT lookup with geocoding and CCN coverage check

Update `apps/web/lib/ai/tools/index.ts` to export new tools.

Update system prompt in `apps/web/app/api/chat/route.ts` to describe new capabilities.

### Phase 4: JSON-Render Integration

Install and integrate `@json-render/core` and `@json-render/react`:

1. Create `apps/web/lib/ui-catalog/catalog.ts` with component definitions
2. Create component implementations in `apps/web/lib/ui-catalog/components/`:
   - `stat.tsx`, `deal-summary.tsx`, `market-snapshot.tsx`, `park-card.tsx`, `comparison-table.tsx`, `alert-banner.tsx`, `charts.tsx`
3. Create `apps/web/lib/ui-catalog/registry.tsx` mapping JSON to components
4. Create `apps/web/app/api/generate-ui/route.ts` for UI generation
5. Update `apps/web/components/ai/chat-message.tsx` to render UI components

### Phase 5: JIT Lookup Service

Create `apps/web/lib/services/jit-lookup.ts` for on-demand data fetching with caching.

### Phase 6: Seed Data Setup

After data sync is working:

1. Create `packages/database/src/seed/` directory
2. Create seed files:
   - `index.ts` - Main seed runner
   - `seed-market-data.ts` - Sample HUD/Census/BLS records
   - `seed-texas-counties.ts` - Texas county reference data
   - `seed-sample-parks.ts` - Sample MH parks with liens
3. Add `db:seed` script to `packages/database/package.json`
4. Document seed usage in README

---

## Key Requirements

- Follow existing code patterns in the repo
- Use Drizzle ORM for database operations
- **Use `db:migrate` only, never `db:push`** (PostGIS compatibility)
- Use Zod for schema validation
- Go code should use `slog` for logging and `errgroup` for concurrency
- All AI tools must return structured data the LLM can interpret
- JSON-Render components should match existing shadcn/ui styling

## Environment Variables Needed

```bash
# Add to apps/web/.env.local
HUD_API_KEY=       # Get from huduser.gov
CENSUS_API_KEY=    # Get from census.gov

# Add to GitHub Secrets (for Go service)
DATABASE_URL=
HUD_API_KEY=
CENSUS_API_KEY=
BLS_API_KEY=       # Optional
```

## Verification

After implementation:

1. Run `go test ./...` in `services/data-sync/`
2. Manually trigger data sync and verify records in database
3. Test AI chat with: "What's the market like in Bexar County?"
4. Verify dynamic UI renders for comparison queries
5. Test seed workflow: `pnpm db:seed` on fresh branch

## Notes

- Start with Phase 1 (database schema) as other phases depend on it
- Phase 2 (Go service) and Phases 3-4 (AI tools, JSON-Render) can be done in parallel
- **Always review generated migrations before running** - especially for spatial columns
- Refer to the plan document for complete code examples
