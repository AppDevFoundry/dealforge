# Flood Zones Data Loading Guide

## Prerequisites

1. PostgreSQL with PostGIS extension enabled
2. Database migrations applied (`pnpm db:migrate`)
3. `DATABASE_URL` set in `.env.local`

## Downloading FEMA NFHL Data

1. Visit the [FEMA Map Service Center](https://msc.fema.gov/portal/advanceSearch)
2. Search for Texas counties (MVP: Bexar, Hidalgo, Cameron, Nueces, Travis)
3. Download the NFHL shapefile (`.zip` format) for each county
4. The shapefile should contain the `S_FLD_HAZ_AR` layer (flood hazard areas)

## Running the Sync Script

```bash
# Load real FEMA data from a shapefile
pnpm --filter @dealforge/database sync:flood path/to/nfhl-shapefile.zip
```

The script will:
- Parse the shapefile using `shpjs`
- Filter features to MVP counties only
- Insert flood zone polygons with zone codes, descriptions, and boundaries
- Print zone distribution statistics

## Using Seed Data for Development

For local development without real FEMA data, use the seed script:

```bash
pnpm --filter @dealforge/database sync:flood:seed
```

This inserts ~15 synthetic flood zone polygons in Bexar County covering all risk levels:
- **High risk (SFHA)**: A, AE, AE FLOODWAY, AH, AO, AR, A99, V, VE
- **Moderate risk**: B, X SHADED
- **Low risk**: X, X UNSHADED, C
- **Undetermined**: D

Polygons are located in the San Antonio area (default map view center).

## Verifying Data Loaded

```sql
-- Total count
SELECT COUNT(*) FROM flood_zones;

-- Distribution by risk level
SELECT
  CASE
    WHEN split_part(zone_code, ' ', 1) IN ('A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE') THEN 'high'
    WHEN split_part(zone_code, ' ', 1) = 'B' OR zone_code LIKE '%SHADED%' THEN 'moderate'
    WHEN zone_code = 'D' THEN 'undetermined'
    ELSE 'low'
  END as risk_level,
  COUNT(*) as count
FROM flood_zones
GROUP BY 1
ORDER BY 1;

-- Zone codes with subtypes
SELECT zone_code, COUNT(*) FROM flood_zones GROUP BY 1 ORDER BY 2 DESC;
```

## End-to-End Verification

1. Start the dev server: `pnpm dev`
2. Navigate to the MH Parks map view
3. Toggle the "Flood Zones" layer on using the layer controls
4. Verify colored polygons appear:
   - Red = High risk (A/AE/V zones)
   - Yellow = Moderate risk (B/X SHADED)
   - Green = Low risk (X/C)
   - Gray = Undetermined (D)
5. Click a flood zone polygon to see the popup with:
   - Zone code
   - Risk level badge
   - Zone description
   - County name
   - SFHA notice (high risk only)

## API Verification

```bash
# Flood zones by bounding box
curl "http://localhost:3000/api/v1/infrastructure/flood-zones?bbox=-98.6,29.3,-98.4,29.5"

# High risk only
curl "http://localhost:3000/api/v1/infrastructure/flood-zones?bbox=-98.6,29.3,-98.4,29.5&highRiskOnly=true"

# Flood zones by county
curl "http://localhost:3000/api/v1/infrastructure/flood-zones?county=Bexar"

# Infrastructure at a point
curl "http://localhost:3000/api/v1/infrastructure/check-point?lat=29.42&lng=-98.49"
```
