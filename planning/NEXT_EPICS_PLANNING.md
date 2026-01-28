# DealForge: Next Epics Planning Document

**Date:** January 2026
**Status:** Planning / Ideation

---

## Executive Summary

DealForge has made significant progress building a solid foundation for Texas mobile home deal intelligence. We now have:

- **TDHCA data pipeline** (ownership records, tax liens)
- **Park detection & distress scoring** (mh_communities with distress metrics)
- **Infrastructure intelligence** (CCN water/sewer boundaries)
- **Market data integration** (HUD FMR, Census demographics, BLS employment)
- **AI Deal Scout** with 10 tools for discovery and analysis
- **Parcel lookup** with geocoding, CCN checks, and nearby park discovery

This document outlines potential next epics that would extend DealForge's value proposition, particularly around **individual property/lead intelligence** and **tax sale opportunities**.

---

## Current Capabilities Assessment

### What We Have

| Capability | Status | Notes |
|------------|--------|-------|
| MH Park Discovery | ✅ Solid | TDHCA-based park detection, distress scoring |
| Tax Lien Tracking | ✅ Solid | TDHCA liens synced, linked to parks |
| Utility Coverage | ✅ Solid | CCN water/sewer boundary checks |
| Market Context | ✅ Solid | HUD FMR, Census, BLS integrated |
| Parcel Lookup | ✅ Basic | Geocoding, CCN check, FMR, nearby parks |
| AI Analysis | ✅ Solid | Deal Scout with 10 tools |
| Parcel/Land Data | ❌ Missing | No CAD/assessor data integration |
| Tax Sale Pipeline | ❌ Missing | No tax sale tracking system |
| Lead Intelligence | ❌ Missing | No structured lead analysis workflow |
| Report Generation | ❌ Missing | No exportable due diligence reports |

### Gap Analysis

The biggest gaps are around **individual property intelligence** (beyond what TDHCA provides for MH parks) and **workflow support** for analyzing leads and generating reports.

---

## Differentiation Strategy: Why Not Just Use Regrid?

**Regrid** (and similar services like CoreLogic, DataTree) provide raw parcel data. DealForge can differentiate by:

1. **RBI-Specific Intelligence** — Not just parcel data, but analysis tailored to mobile home/land deals with 21st Century Mortgage considerations

2. **Texas TDHCA Integration** — No competitor combines parcel data with TDHCA ownership records, tax liens, and park intelligence

3. **Utility Feasibility** — CCN coverage analysis for development feasibility (unique value for land deals)

4. **AI-Powered Analysis** — Natural language deal analysis, not just data display

5. **Due Diligence Reports** — Automated report generation for lenders/partners

6. **Tax Sale Pipeline** — Proactive tracking of upcoming tax sales (law firm lists)

7. **Workflow Integration** — From lead intake to analysis to report generation to closing

---

## Proposed Epics

### Epic 1: Lead Intelligence & Due Diligence Reports

**Problem Statement:**
When an RBI colleague receives a lead like "122 County Rd. 3052, Orange Grove, TX 78372", they need to quickly gather intelligence and assess the deal. Currently this requires manual research across multiple sources.

**Solution:**
Build a "Lead Analyzer" feature that takes a property address (or parcel) and generates comprehensive intelligence including:

- Property details (geocoded location, county, parcel info if available)
- Utility coverage (CCN water/sewer check)
- Flood zone check
- Market context (FMR, demographics, employment)
- Nearby MH parks (competition analysis)
- Title/ownership records (if in TDHCA database)
- Tax lien status
- Comparable lot rents
- AI-generated insights and risk factors

**Monetization Potential:**
- X free reports per month
- Pay-per-report for additional ($5-15/report)
- Subscription tier for unlimited reports

**Stories:**

| Story | Description | Effort |
|-------|-------------|--------|
| Lead Intake Form | Simple form to enter property address + known details | S |
| Enhanced Parcel Lookup | Extend lookupParcelData tool with more data sources | M |
| Flood Zone Check | Add FEMA NFHL flood zone lookup | M |
| Lead Dashboard | UI to view/manage submitted leads | M |
| Due Diligence Report Generator | PDF/DOCX report with all gathered intelligence | L |
| AI Lead Analysis Tool | New Deal Scout tool for lead-specific analysis | M |
| Report History & Storage | Store generated reports for user access | S |

**Example User Flow:**

```
User enters: 122 County Rd. 3052, Orange Grove, TX 78372

System returns:
├── Location: Jim Wells County, TX
├── Coordinates: 27.9234, -97.8123
├── Parcel: [If CAD data available]
├── Utilities:
│   ├── Water CCN: Orange Grove WSC ✅
│   └── Sewer CCN: None ❌ (septic likely)
├── Flood Zone: Zone X (minimal flood hazard) ✅
├── Market Context:
│   ├── FMR 2BR: $1,085/mo
│   ├── Suggested Lot Rent: $325-$434/mo
│   ├── Median HH Income: $52,340
│   └── Unemployment: 4.2%
├── Nearby MH Parks: 3 within 10 miles
├── TDHCA Records: [If home is titled in TX]
├── Tax Status: [Lien check]
└── AI Insights:
    ├── Property is on 2 acres with municipal water - good for MH placement
    ├── No sewer CCN - will need septic system
    ├── 3 nearby parks with avg 35% distress score - limited competition
    └── Risk: Underwater mortgage ($116k owed vs $115k ask)
```

---

### Epic 2: Texas Parcel Data Integration

**Problem Statement:**
For land development opportunities and detailed property analysis, we need parcel-level data including ownership, acreage, assessed values, and boundaries.

**Data Sources:**

1. **TxGIO/TNRIS Statewide Parcels** (Free)
   - ~13M parcels across Texas
   - Owner name, property address, legal description
   - Updated periodically

2. **County CAD APIs** (Variable availability)
   - More detailed/current than TxGIO
   - Assessed values, improvement details
   - Some counties have APIs, others require scraping

3. **Regrid API** (Paid - $$$)
   - Standardized national parcel data
   - Clean API, premium pricing
   - Consider for specific high-value use cases

**Recommended Approach:**

Start with **TxGIO/TNRIS free data** for basic parcel information, then consider county-specific integrations for high-priority markets.

**Stories:**

| Story | Description | Effort |
|-------|-------------|--------|
| TxGIO Parcel Download | Script to download Texas parcel shapefile | M |
| Parcel Database Schema | Design schema for parcel data | S |
| Parcel Data Import | PostGIS import of parcel boundaries | L |
| Parcel Lookup by Point | Find parcel containing a lat/lng | S |
| Parcel Lookup by Address | Find parcel by property address | M |
| Owner Information Display | Show parcel owner in UI | S |
| Parcel Detail API | API endpoint for parcel info | M |
| Map Parcel Layer | Display parcel boundaries on map | M |

**Data Fields from TxGIO:**
- GEO_ID (unique parcel ID)
- OWNER_NAME
- PROP_ADDR (property address)
- LEGAL_DESC
- ACRES
- County FIPS
- Geometry (boundary polygon)

---

### Epic 3: Tax Sale Pipeline (Tax Delinquent Tracker Migration)

**Problem Statement:**
You've built a separate "Tax Delinquent Tracker" app that processes CSV files from law firms handling tax sales. This should be migrated into DealForge as a unified module.

**Solution:**
Create a "Tax Sales" module within DealForge that:

1. Accepts CSV uploads of upcoming tax sale properties
2. Geocodes and enriches each property with DealForge data
3. Allows filtering/searching by county, property type, sale date
4. Shows properties on the map
5. Generates alerts when properties match criteria
6. Tracks status through the tax sale process

**Stories:**

| Story | Description | Effort |
|-------|-------------|--------|
| Tax Sale Database Schema | Tables for tax sale properties, events | M |
| CSV Upload & Parser | Upload interface + CSV parsing | M |
| Property Enrichment | Geocode + add CCN/market data | M |
| Tax Sale List UI | Searchable/filterable list view | M |
| Tax Sale Map View | Show tax sale properties on map | M |
| Property Detail + Intelligence | Full analysis for each tax sale property | L |
| Alert System | Notify when matching properties found | M |
| Status Tracking | Track bid/won/lost status | S |
| Law Firm Source Management | Track which law firm/county sources | S |

**Database Schema Additions:**

```sql
-- Tax sale source (law firm / county)
CREATE TABLE tax_sale_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  county TEXT,
  law_firm TEXT,
  contact_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual tax sale properties
CREATE TABLE tax_sale_properties (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES tax_sale_sources(id),

  -- Property info from CSV
  property_address TEXT,
  city TEXT,
  county TEXT NOT NULL,
  zip_code TEXT,
  legal_description TEXT,
  account_number TEXT,

  -- Sale info
  sale_date DATE,
  minimum_bid NUMERIC,
  taxes_owed NUMERIC,
  years_delinquent INTEGER,

  -- Enriched data (from DealForge)
  latitude REAL,
  longitude REAL,
  has_water_ccn BOOLEAN,
  has_sewer_ccn BOOLEAN,
  flood_zone TEXT,

  -- Status tracking
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'scheduled', 'completed', 'cancelled'
  our_interest TEXT, -- 'watching', 'bidding', 'passed'
  max_bid NUMERIC,
  outcome TEXT, -- 'won', 'lost', 'no_bid'

  -- Metadata
  source_file TEXT,
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Epic 4: Enhanced Mapping & Visualization

**Problem Statement:**
We have multiple data layers (CCN, parks, leads, tax sales) but need better map visualization to see them all together.

**Solution:**
Enhance the existing map with toggleable layers and better interactivity.

**Stories:**

| Story | Description | Effort |
|-------|-------------|--------|
| Layer Control Panel | Toggle visibility of different layers | M |
| Parcel Boundaries Layer | Show parcel polygons when zoomed in | M |
| Tax Sale Properties Layer | Pins for upcoming tax sales | S |
| Lead Properties Layer | Pins for submitted leads | S |
| Zoning Data Layer | If/when zoning data is available | L |
| Distance Tool | Measure distances on map | S |
| Polygon Selection | Draw area to find properties within | M |
| Map Export | Export current view as image | S |

---

### Epic 5: Zoning Intelligence (Future)

**Problem Statement:**
For land development, zoning is critical but data is fragmented across municipalities.

**Considerations:**
- Zoning data is NOT standardized across Texas
- Each city/county has different classifications
- ETJ (Extra-Territorial Jurisdiction) adds complexity
- May need to start with specific high-priority counties

**Recommendation:**
Defer this epic unless there's a specific county/market focus. Instead, add a "zoning notes" field to leads where users can manually capture zoning info from their research.

---

### Epic 6: 21st Century Mortgage Integration

**Problem Statement:**
RBI holders work extensively with 21st Century Mortgage for land+home financing. The platform should support this workflow.

**Stories:**

| Story | Description | Effort |
|-------|-------------|--------|
| 21CM Checklist Template | Standard checklist for 21CM deals | S |
| Deal Stage Tracking | Track where each deal is in 21CM process | M |
| Document Checklist | Track required documents | M |
| Pro Forma for 21CM | Deal analysis formatted for 21CM review | M |

---

## Prioritization Recommendation

Based on immediate value and effort:

### Phase 1 (Next 4-6 weeks)

1. **Epic 1: Lead Intelligence & Reports** — Highest immediate value for analyzing leads like the Orange Grove example. Creates monetizable feature.

2. **Epic 3: Tax Sale Pipeline** — Migrates existing work, creates new deal flow source.

### Phase 2 (Following 4-6 weeks)

3. **Epic 2: Parcel Data Integration** — Adds depth to property analysis.

4. **Epic 4: Enhanced Mapping** — Better visualization of all data.

### Phase 3 (Future)

5. Epic 6: 21CM Integration
6. Epic 5: Zoning (if specific market need)

---

## Technical Considerations

### For Lead Intelligence

The existing `lookupParcelData` tool is a good foundation. Extend it with:

```typescript
// New AI tool: analyzePropertyLead
const analyzePropertyLead = tool({
  description: 'Comprehensive analysis of a property lead including all available intelligence',
  inputSchema: z.object({
    address: z.string().describe('Property address'),
    askingPrice: z.number().optional(),
    propertyDetails: z.object({
      yearBuilt: z.number().optional(),
      bedrooms: z.number().optional(),
      bathrooms: z.number().optional(),
      type: z.enum(['singlewide', 'doublewide', 'land', 'land_with_home']).optional(),
      acreage: z.number().optional(),
      condition: z.enum(['excellent', 'good', 'average', 'poor', 'needs_work']).optional(),
    }).optional(),
    mortgageBalance: z.number().optional(),
    sellerMotivation: z.string().optional(),
  }),
  execute: async (params) => {
    // Combine lookupParcelData + additional analysis
    // Return comprehensive intelligence
  }
});
```

### For Tax Sales

Consider a dedicated API route for CSV upload:

```typescript
// POST /api/v1/tax-sales/import
// Accepts multipart/form-data with CSV file
// Returns enriched properties
```

### For Reports

Use a library like `pdfmake` or `@react-pdf/renderer` to generate professional PDF reports.

---

## The Orange Grove Example

Let's trace how the proposed system would handle the lead you mentioned:

**Input:**
```
Address: 122 County Rd. 3052, Orange Grove, TX 78372
Year Built: 2014
Bedrooms: 2
Bathrooms: 2
Type: Singlewide
Condition: Average (water damage)
Asking: $115,000
Mortgage: $116,000 (underwater!)
Acreage: 2 acres
Extras: RV carport, storage building, gazebo
```

**DealForge Analysis:**

1. **Geocode** → Jim Wells County, coordinates
2. **CCN Check** → Water: ✅ Orange Grove WSC, Sewer: ❌ (septic)
3. **Flood Check** → Zone X (minimal hazard)
4. **Market Context** → FMR, demographics, employment
5. **Nearby Parks** → Competition analysis
6. **TDHCA Lookup** → Check if MH is titled in database, any liens
7. **AI Insights:**
   - "Deal is underwater ($1k negative equity) - seller may need short sale"
   - "2 acres with water service - good for potential lot split or additional units"
   - "Water damage noted - require inspection and repair estimate"
   - "Rural location in Jim Wells County - limited competition but also limited demand"
   - "Consider: Acquire land, move damaged home, install new unit"

**Report Output:**
PDF with all the above, formatted for RBI decision-making and potential 21CM submission.

---

## Next Steps

1. **Review this document** and select which epics to pursue
2. **Prioritize stories** within the selected epic(s)
3. **Define acceptance criteria** for first sprint
4. **Begin implementation**

---

## Questions for Discussion

1. **Lead Intelligence Monetization:** What pricing model makes sense? Per-report vs subscription?

2. **Tax Sale Sources:** Which law firms/counties do you currently get tax sale lists from?

3. **Priority Markets:** Are there specific counties we should prioritize for parcel data integration?

4. **Report Format:** What should the due diligence report look like? Any existing templates to reference?

5. **User Roles:** Should there be different access levels (individual user vs team vs enterprise)?

---

*This document is a living planning artifact. Update as decisions are made and priorities shift.*
