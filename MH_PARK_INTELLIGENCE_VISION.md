# MH Park Intelligence

**Texas Mobile Home Park Data & Analysis Platform**

> *"Find, analyze, and underwrite mobile home park opportunities with open data intelligence."*

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Opportunity](#the-opportunity)
3. [Target Audience](#target-audience)
4. [Available Open Data Sources](#available-open-data-sources)
5. [Feature Architecture](#feature-architecture)
6. [Technical Architecture](#technical-architecture)
7. [MVP Scope](#mvp-scope)
8. [Development Roadmap](#development-roadmap)
9. [Future Expansion](#future-expansion)

---

## Executive Summary

### The Pivot

MH Park Intelligence represents a focused evolution of the DealForge vision. Rather than building a general-purpose real estate calculator competing with established players (BiggerPockets, DealCheck), we're building a **specialized data intelligence platform for mobile home park investors in Texas**.

### Why This Focus?

1. **Accessible Data**: Texas has uniquely rich, publicly available manufactured housing data through TDHCA that no one is effectively leveraging
2. **Underserved Market**: MH park investors pay thousands of dollars for basic park lists and data that should be freely accessible
3. **Clear Alignment**: SoTexFund's buy box includes "Develop mobile/land package" - we're building what we need
4. **Domain Expertise**: Team includes an RBI license holder actively pursuing MH deals
5. **Defensible Moat**: Data aggregation and intelligence layer creates real barriers to competition

### Core Value Proposition

**For mobile home park investors**: The first platform that combines Texas manufactured housing data, infrastructure intelligence, and deal analysis in one place - surfacing opportunities that others miss.

---

## The Opportunity

### The Problem

Mobile home park investors face significant data challenges:

| Challenge | Current State | Our Solution |
|-----------|--------------|--------------|
| **Finding Parks** | Pay $2,000+ for basic lists from MHVillage or hire VAs to scrape CAD websites | Free, searchable database built from open data |
| **Market Activity** | No visibility into which areas are growing/declining | TDHCA titling data shows real-time market activity |
| **Distress Signals** | Manual research across county tax offices | Aggregated tax lien and delinquency data |
| **Infrastructure** | Call utilities, search multiple GIS systems | Unified map showing water/sewer CCN coverage |
| **Land Opportunities** | No systematic way to find developable parcels | Overlay analysis: parcels + utilities + flood + zoning |

### Market Size

- **2,700+** manufactured home communities in Texas (TMHA data)
- **500,000+** manufactured homes titled in Texas (TDHCA data)
- **Growing segment**: Manufactured housing is increasingly recognized as affordable housing solution
- **Active investors**: Mobile home park investing has dedicated communities (BiggerPockets, MHU, etc.)

### Competitive Landscape

| Competitor | What They Do | Gap We Fill |
|------------|--------------|-------------|
| **MHVillage** | Park listings, lot availability | No underwriting tools, data behind paywall |
| **CoStar** | Commercial RE data | MH parks underserved, expensive |
| **TaxNetUSA** | Property tax/appraisal data | Not MH-specific, no analysis tools |
| **BiggerPockets** | Education, basic calculators | No Texas-specific MH data |

**No one is combining Texas open data + MH-specific intelligence + analysis tools.**

---

## Target Audience

### Primary Users

| Segment | Description | Key Needs |
|---------|-------------|-----------|
| **MH Park Investors** | Actively acquiring parks (5-200 lots) | Deal finding, market intelligence, underwriting |
| **Land Developers** | Seeking sites for new MH communities | Infrastructure mapping, zoning, feasibility |
| **MH Park Operators** | Own/manage existing parks | Market benchmarking, expansion opportunities |
| **MH Retailers/Lenders** | Finance manufactured homes | Market activity, placement trends |

### Secondary Users

- Real estate brokers specializing in MH parks
- Private equity funds evaluating MH as asset class
- Economic development organizations
- Affordable housing researchers

---

## Available Open Data Sources

### Tier 1: Texas Manufactured Housing (Primary)

| Source | Data Available | Access Method | Update Frequency |
|--------|---------------|---------------|------------------|
| **TDHCA MH Division** | Ownership records, tax liens, titling by county, license holders, installation records | Web search + downloadable reports | Daily updates |
| **TMHA** | Retail sales data, manufacturer shipments, average prices, community list (partial) | Public reports + member data | Monthly |

**Key TDHCA Data Points:**
- Statement of Ownership records (searchable by county, address, serial number)
- Tax lien records on manufactured homes
- Monthly titling reports by county (market activity indicator)
- License holder database (retailers, installers, manufacturers)
- Installation and inspection records

### Tier 2: Infrastructure & Utilities

| Source | Data Available | Access Method | Notes |
|--------|---------------|---------------|-------|
| **PUC Texas CCN** | Water & sewer service area boundaries | GIS download / ArcGIS services | Critical for development feasibility |
| **FEMA NFHL** | Flood zone boundaries | GIS download / WMS services | Risk assessment, insurance costs |
| **TxGIO/TNRIS** | Land parcels, aerial imagery, address points | DataHub downloads | Foundation for mapping |
| **TCEQ** | Environmental permits, water quality | GIS Data Hub | Environmental due diligence |

**PUC CCN Data is Gold:**
- Shows exactly where municipal water/sewer service is available
- Critical for land development feasibility
- Available as downloadable shapefiles
- Updated quarterly

### Tier 3: Property & Tax Data

| Source | Data Available | Access Method | Notes |
|--------|---------------|---------------|-------|
| **County Appraisal Districts** | Property values, owner info, characteristics | Individual county websites (254 counties) | Fragmented but essential |
| **County Tax Sales** | Foreclosure listings, minimum bids | Individual county/constable websites | High-value for distressed deals |
| **Texas Comptroller** | Aggregate property tax data, ratio studies | Public reports | Market context |

**Reality Check:** County-level data requires ongoing aggregation effort. Start with key South Texas counties, expand over time.

### Tier 4: Market Context

| Source | Data Available | Access Method | Notes |
|--------|---------------|---------------|-------|
| **HUD** | Fair Market Rents | Free API | Lot rent benchmarking context |
| **Census/ACS** | Demographics, income, housing | Free API | Market analysis |
| **BLS** | Employment, wage data | Free API | Economic indicators |

---

## Feature Architecture

### Phase 1: Data Foundation (MVP)

| Feature | Description | Data Source | Priority |
|---------|-------------|-------------|----------|
| **MH Park Map** | Interactive map of MH communities in Texas | TDHCA + County CAD | P0 |
| **Market Activity Dashboard** | Monthly titling activity by county/region | TDHCA reports | P0 |
| **Park Search** | Search/filter parks by location, size, characteristics | Aggregated data | P0 |
| **Basic Park Calculator** | Lot rent × lots, expense ratios, cap rate, NOI | User input | P0 |

### Phase 2: Intelligence Layer

| Feature | Description | Data Source | Priority |
|---------|-------------|-------------|----------|
| **Infrastructure Overlay** | Water/sewer CCN boundaries on map | PUC Texas | P1 |
| **Flood Zone Overlay** | FEMA flood zones on map | FEMA NFHL | P1 |
| **Tax Lien Tracker** | MH with recorded tax liens (distress signal) | TDHCA | P1 |
| **County Deep Dive** | Detailed market report for specific county | Multiple sources | P1 |

### Phase 3: Analysis Tools

| Feature | Description | Priority |
|---------|-------------|----------|
| **Park Underwriting Calculator** | Full pro forma: income, expenses, financing, returns | P2 |
| **Land Development Feasibility** | Parcel + utilities + flood + rough cost analysis | P2 |
| **Deal Comparison** | Side-by-side park analysis | P2 |
| **AI Deal Coach** | "What concerns you about this deal?" | P2 |

### Phase 4: Advanced Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **Opportunity Alerts** | Notify when new parks list, tax liens filed, etc. | P3 |
| **Comparable Sales Database** | Track MH park transactions over time | P3 |
| **Portfolio Tracker** | Monitor your owned parks | P3 |
| **Export/Reports** | PDF reports for lenders, partners | P3 |

---

## Technical Architecture

### Stack (Leveraging Existing DealForge Foundation)

| Layer | Technology | Notes |
|-------|------------|-------|
| **Framework** | Next.js 15 (App Router) | Already configured |
| **Database** | Neon Postgres + PostGIS | Enable spatial queries |
| **ORM** | Drizzle | Already configured |
| **Maps** | Mapbox GL JS + react-map-gl | Rich mapping capabilities |
| **UI** | shadcn/ui + Tailwind | Already configured |
| **Auth** | BetterAuth | Already planned |

### Data Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA SOURCES                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐          │
│   │   TDHCA     │   │  PUC Texas  │   │    FEMA     │          │
│   │  MH Records │   │  CCN Data   │   │   NFHL      │          │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │
│          │                  │                  │                 │
│   ┌──────┴──────┐   ┌──────┴──────┐   ┌──────┴──────┐          │
│   │   TxGIO     │   │   County    │   │    HUD      │          │
│   │  Parcels    │   │    CAD      │   │    FMR      │          │
│   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘          │
│          │                  │                  │                 │
└──────────┼──────────────────┼──────────────────┼─────────────────┘
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA SYNC SERVICE                            │
│                  (Go or Node scheduled jobs)                     │
│                                                                  │
│   • Fetch TDHCA reports (monthly)                               │
│   • Download/process CCN shapefiles (quarterly)                 │
│   • Aggregate county CAD data (ongoing)                         │
│   • Process FEMA flood data (as updated)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEON POSTGRES + POSTGIS                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│   │  mh_communities │  │   ccn_areas     │  │  flood_zones    │ │
│   │  (parks)        │  │   (water/sewer) │  │  (FEMA)         │ │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│   │  mh_titlings    │  │   tax_liens     │  │  parcels        │ │
│   │  (activity)     │  │   (distress)    │  │  (land)         │ │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐                      │
│   │  market_data    │  │  user_deals     │                      │
│   │  (HUD, Census)  │  │  (saved)        │                      │
│   └─────────────────┘  └─────────────────┘                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS APPLICATION                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│   │   Map View      │  │   Search/Filter │  │   Calculators   │ │
│   │   (Mapbox)      │  │                 │  │                 │ │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
│   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│   │   Dashboards    │  │   Deal Library  │  │   AI Chat       │ │
│   │   (market data) │  │   (saved deals) │  │   (future)      │ │
│   └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (Core Tables)

```sql
-- MH Communities/Parks
CREATE TABLE mh_communities (
  id UUID PRIMARY KEY,
  name TEXT,
  address TEXT,
  city TEXT,
  county TEXT,
  state TEXT DEFAULT 'TX',
  zip TEXT,
  location GEOGRAPHY(POINT, 4326),
  lot_count INTEGER,
  estimated_occupancy DECIMAL,
  property_type TEXT, -- 'family', 'senior', 'mixed'
  owner_name TEXT,
  owner_address TEXT,
  cad_property_id TEXT,
  source TEXT, -- 'tdhca', 'cad', 'manual'
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Monthly Titling Activity (from TDHCA reports)
CREATE TABLE mh_titlings (
  id UUID PRIMARY KEY,
  county TEXT NOT NULL,
  month DATE NOT NULL, -- First of month
  new_titles INTEGER,
  transfers INTEGER,
  total_active INTEGER,
  source_report TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(county, month)
);

-- Tax Liens on Manufactured Homes
CREATE TABLE mh_tax_liens (
  id UUID PRIMARY KEY,
  serial_number TEXT,
  hud_label TEXT,
  county TEXT,
  taxing_entity TEXT,
  amount DECIMAL,
  year INTEGER,
  status TEXT, -- 'active', 'released'
  filed_date DATE,
  released_date DATE,
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Water/Sewer CCN Service Areas
CREATE TABLE ccn_areas (
  id UUID PRIMARY KEY,
  ccn_number TEXT,
  utility_name TEXT,
  service_type TEXT, -- 'water', 'sewer', 'both'
  county TEXT,
  boundary GEOGRAPHY(POLYGON, 4326),
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- FEMA Flood Zones
CREATE TABLE flood_zones (
  id UUID PRIMARY KEY,
  zone_code TEXT, -- 'A', 'AE', 'X', etc.
  zone_description TEXT,
  county TEXT,
  boundary GEOGRAPHY(MULTIPOLYGON, 4326),
  effective_date DATE,
  source_updated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User Saved Deals/Analysis
CREATE TABLE user_deals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name TEXT,
  deal_type TEXT, -- 'park_acquisition', 'land_development'
  community_id UUID REFERENCES mh_communities(id),
  inputs JSONB,
  results JSONB,
  notes TEXT,
  status TEXT, -- 'analyzing', 'pursuing', 'passed', 'acquired'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Spatial indexes
CREATE INDEX idx_communities_location ON mh_communities USING GIST(location);
CREATE INDEX idx_ccn_boundary ON ccn_areas USING GIST(boundary);
CREATE INDEX idx_flood_boundary ON flood_zones USING GIST(boundary);
```

---

## MVP Scope

### MVP Goal (4-6 weeks)

**Deliver a working map-based tool that shows MH community locations in Texas with basic market activity data.**

### MVP Features

#### 1. Interactive Map

- Display MH communities as pins on Texas map
- Click pin to see basic details (name, address, county, lot count if known)
- Pan, zoom, search by location
- Layer toggle for community type (family/senior)

#### 2. Market Activity Dashboard

- Texas-wide monthly titling activity chart
- County-level breakdown (top 20 counties)
- Trend indicators (up/down vs prior period)
- Data from TDHCA monthly reports

#### 3. Park Search/Filter

- Search by county, city, or address
- Filter by lot count range (if available)
- Filter by property type
- Export results to CSV

#### 4. Basic Park Calculator

- Inputs: lot count, average lot rent, occupancy, expense ratio
- Outputs: Gross income, NOI, cap rate (at user price), cash flow
- Save/load functionality
- Simple sensitivity slider (occupancy, rent)

### MVP Data Sources

| Source | Data | Acquisition Method |
|--------|------|-------------------|
| **TDHCA** | Monthly titling reports | Manual download + parse, automate later |
| **TMHA** | Community list (public portion) | Web research |
| **County CADs** | Park locations/details (5 initial counties) | Manual research |

### Initial County Focus

Start with counties in SoTexFund's target area + high MH activity:

1. **Bexar County** (San Antonio)
2. **Hidalgo County** (McAllen/Rio Grande Valley)
3. **Cameron County** (Brownsville)
4. **Nueces County** (Corpus Christi)
5. **Travis County** (Austin) - for comparison/testing

### MVP Technical Tasks

1. [ ] Enable PostGIS on Neon database
2. [ ] Create core database schema
3. [ ] Build Mapbox integration with community pins
4. [ ] Create data ingestion scripts for TDHCA reports
5. [ ] Manual data entry for initial 5 counties (50-100 parks)
6. [ ] Build market activity dashboard
7. [ ] Build search/filter interface
8. [ ] Build basic calculator (extend existing rental calculator)
9. [ ] Basic auth (continue BetterAuth implementation)

### MVP Success Criteria

- [ ] User can view map of MH parks in 5 Texas counties
- [ ] User can see monthly titling activity trends
- [ ] User can search/filter parks and export list
- [ ] User can run basic NOI/cap rate calculation
- [ ] Data is less than 30 days old

---

## Development Roadmap

### Phase 1: MVP Foundation (Weeks 1-4)

**Goal**: Working map with community data and basic calculator

- Week 1: Database schema, PostGIS setup, Mapbox integration
- Week 2: TDHCA data ingestion, manual community data entry
- Week 3: Market dashboard, search/filter functionality
- Week 4: Calculator, auth, polish, deploy

**Deliverable**: Users can explore TX MH parks on a map and run basic analysis

### Phase 2: Infrastructure Intelligence (Weeks 5-8)

**Goal**: Add utility and flood data overlays

- Week 5: Download and process PUC CCN shapefiles
- Week 6: Integrate CCN boundaries as map layer
- Week 7: Download and process FEMA NFHL data
- Week 8: Integrate flood zones, layer controls

**Deliverable**: Users can see which areas have municipal water/sewer and flood risk

### Phase 3: Expanded Data & Analysis (Weeks 9-12)

**Goal**: More counties, better analysis tools

- Week 9-10: Expand to 15+ counties, automate data refresh
- Week 11: Full park underwriting calculator
- Week 12: AI deal coach integration (basic)

**Deliverable**: Comprehensive coverage of major TX markets with real analysis tools

### Phase 4: Advanced Features (Weeks 13-16)

**Goal**: Opportunity detection and user features

- Week 13: Tax lien tracking and alerts
- Week 14: Deal comparison view, saved deals library
- Week 15: Land development feasibility tool
- Week 16: Export/reports, portfolio tracker

**Deliverable**: Full-featured platform for serious MH park investors

---

## Future Expansion

### Geographic Expansion

After proving the model in Texas:

1. **Florida** - Large MH market, similar data availability
2. **Arizona** - Growing MH market
3. **Other states** - Based on demand and data availability

### Feature Expansion

1. **Comparable Sales Database** - Track actual MH park transactions
2. **Lender Network** - Connect users with MH park financing
3. **Deal Marketplace** - Off-market deal sharing (with permission)
4. **Due Diligence Checklists** - Guided acquisition process
5. **Mobile App** - Field research tool

### Monetization Path

| Tier | Price | Features |
|------|-------|----------|
| **Free** | $0 | Map view, 5 saved searches, basic calculator |
| **Pro** | $49/mo | Full search/export, all data layers, unlimited saves, AI coach |
| **Team** | $149/mo | Pro + 5 seats, shared deal library, custom alerts |
| **API** | Custom | Programmatic access for lenders, brokers |

### Potential Rebrand

Consider rebranding from "DealForge" to something MH-specific:

- **ParkIntel** - Mobile home park intelligence
- **LotLine** - Reference to lot rent, the key revenue driver
- **MHInsight** - Manufactured housing insight
- **ParkPulse** - Market activity focus

---

## Appendix: Key TDHCA Data Points

### Available Reports (mhweb.tdhca.state.tx.us)

1. **Ownership Records Search** - By serial number, HUD label, address, county
2. **Tax Lien Records** - Active liens on manufactured homes
3. **Monthly Titling Report** - New titles by county
4. **License Holder Search** - Active retailers, installers, manufacturers
5. **Installation/Inspection Records** - By serial number

### Data Fields (from Statement of Ownership)

- Serial Number
- HUD Label Number
- Texas Seal Number
- Make/Model/Year
- Install Address
- Install County
- Owner Name
- Lienholder(s)
- Real/Personal Property Status

### Potential Insights

- **Market Activity**: Monthly titling by county shows demand trends
- **Distress Signals**: Tax liens indicate financial stress
- **Park Identification**: Clustering of MH titles at same address = likely park
- **New Development**: Surge in new installations = new community

---

*This is a living document. Last updated: January 2025*
