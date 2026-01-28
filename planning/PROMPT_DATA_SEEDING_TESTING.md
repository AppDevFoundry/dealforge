# Populate Real Data, Create Seed Files & Add Tests

## What to Build

Set up a solid data foundation for the DealForge MH park intelligence platform:

1. **Populate real data** - Import actual TDHCA records (titles, liens), run Go sync for market data (HUD, Census, BLS), discover parks, calculate distress scores

2. **Create seed data system** - Export real data subset to JSON files in `data/seed/` so dev databases can be quickly reset with representative data

3. **Add test suites** - Unit tests for Go API clients (HUD, Census, BLS) and integration tests for AI tools (getMarketContext, lookupParcelData, searchDistressedParks)

## Reference Documents

- `PLAN_DATA_SEEDING_AND_TESTING.md` - Full implementation plan with scripts, test code, and execution steps

## Manual Prerequisites

1. Download TDHCA data from mhweb.tdhca.state.tx.us (titles CSV + liens CSV)
2. Get API keys: HUD (huduser.gov), Census (api.census.gov)
3. Place CSVs in `data/raw/tdhca/`

## Execution Order

1. Clear fake data → Import TDHCA → Discover parks → Calculate distress
2. Run Go sync for market data
3. Export seed files from populated database
4. Implement Go tests with mock HTTP servers
5. Implement AI tool tests with mock database
6. Update CI workflow

## Success Looks Like

- Database contains real Texas MH park data with distress scores
- `pnpm db:seed:real` can reset any dev database with real data in minutes
- `go test ./...` passes for all Go API clients
- `pnpm test` passes for all AI tools
- CI runs both test suites on every PR
