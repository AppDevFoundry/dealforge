# Implement Market Intelligence & Dynamic UI for DealForge

## What to Build

Extend our MH park intelligence platform with:

1. **Go data sync service** - Fetch HUD Fair Market Rents, Census demographics, and BLS employment data from government APIs. Store in Postgres.

2. **New AI tools** - Add `getMarketContext` and `lookupParcelData` tools so the Deal Scout chat can answer market questions and do JIT address lookups.

3. **Dynamic UI rendering** - Integrate `@json-render/react` so AI responses can render as charts, tables, and cards instead of just text.

## Reference Documents

- `PLAN_MARKET_INTELLIGENCE_V2.md` - Full implementation plan with code examples, schemas, and architecture
- `PROMPT_MARKET_INTELLIGENCE_IMPLEMENTATION.md` - Detailed task breakdown by phase

## Starting Point

Begin with the database schema (Phase 1), then proceed through the phases. The Go service and AI tools can be developed in parallel.

## Success Looks Like

- User asks "What's the market like around this park?" and gets FMR, demographics, employment data
- AI responses include visual components (stats, charts, deal summaries) not just text
- Go service runs weekly via GitHub Actions to keep market data fresh
