# TDHCA UI Roadmap

Planned UI enhancements for TDHCA data integration beyond the initial Community Detail Page.

## 1. Distressed Parks Dashboard

Ranking table on `/mh-parks/dashboard` showing parks sorted by active lien count. Uses the existing `getDistressedParks()` query from `apps/web/lib/tdhca/queries.ts`. Columns: Park Name, City, County, Active Liens, Total Tax Owed, Lot Count. Filterable by county.

## 2. TDHCA Badges on Park Cards

Show a small lien count badge on `park-card.tsx` when TDHCA data exists for a community. Requires a lightweight lookup (e.g., batch query on search results) to avoid N+1 API calls. Badge shows active lien count with amber color for distress indication.

## 3. Title Activity Feed

Chronological feed of recent titling events across all parks, displayed on a dedicated tab or section of the dashboard. Filterable by county and date range. Shows certificate number, owner, sale date, and election type.

## 4. Batch Geocoding

Geocode TDHCA-discovered parks that lack coordinates for map display. Use a geocoding service (e.g., Mapbox Geocoding API) to resolve addresses to lat/lng. Store results in `mh_communities.latitude`/`longitude` columns. Run as a background job or CLI script.

## 5. Multi-County Expansion

Download and process TDHCA ownership records and tax liens for additional Texas counties beyond Bexar. Update the Go data-sync service to support configurable county lists. Add county selection UI in the dashboard for filtering.
