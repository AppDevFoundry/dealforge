  
**DEALFORGE**  
Texas Mobile Home Deal Intelligence Platform

**Strategic Vision & Implementation Plan**  
January 2026

| Core Value Proposition Transform openly available Texas manufactured housing data into actionable deal intelligence—helping RBI license holders and land developers identify, analyze, and close mobile home park acquisitions and land development opportunities faster than the competition. |
| :---- |

# **Executive Summary**

## **The Opportunity**

Texas maintains one of the most comprehensive manufactured housing datasets in the country through TDHCA (Texas Department of Housing and Community Affairs). This data—including ownership records, tax liens, titling activity, and license holder information—is publicly available but fragmented and difficult to use. No one is effectively aggregating and analyzing this data for investors.

Combined with PUC utility service area boundaries, county parcel data, and FEMA flood zones, we can build a deal intelligence platform that surfaces opportunities invisible to competitors relying on traditional deal sourcing methods.

## **Strategic Focus: RBI-Powered Deal Flow**

Your colleague's RBI (Retailer/Broker/Installer) license is a critical competitive advantage. Unlike passive investors who can only purchase existing parks, an RBI license holder can:

* Develop raw land into new MH communities

* Work directly with 21st Century Mortgage for land+home financing

* Partner with manufactured home builders for new inventory

* Convert distressed parks or land into profitable developments

DealForge should be built to maximize the value of this license—surfacing not just park acquisitions, but land development opportunities, distressed assets, and market inefficiencies that only an RBI can capitalize on.

# **The Data Ecosystem**

## **Primary Data Source: TDHCA MHWeb**

The Texas Department of Housing and Community Affairs Manufactured Housing Division maintains comprehensive records accessible through mhweb.tdhca.state.tx.us:

| Data Type | Key Fields | Deal Intelligence Value |
| :---- | :---- | :---- |
| **Ownership Records** | Serial \#, HUD label, owner, address, county, liens | Identify parks by clustering titles at same address; track ownership changes |
| **Tax Lien Records** | Amount, tax year, status, county, taxing entity | Distress signals—parks with high lien concentration are acquisition targets |
| **Monthly Titling Reports** | New titles, transfers by county/month | Market momentum—which counties are hot/cooling; where demand exceeds supply |
| **License Holder Database** | Active retailers, installers, manufacturers, brokers | Build partner network; identify potential JV opportunities; competitive intel |

## **Infrastructure Intelligence: PUC CCN Data**

The Public Utility Commission of Texas maintains GIS shapefiles of all Certificate of Convenience and Necessity (CCN) service areas. This data is gold for land development feasibility:

* **Water CCN boundaries:** Shows where municipal water service is available

* **Sewer CCN boundaries:** Shows where sewer service is available

* **CCN Facility lines:** Shows actual infrastructure proximity to parcels

* Updated quarterly from puc.texas.gov/industry/water/utilities/gis/

| Why This Matters for RBI Developers A parcel inside a water/sewer CCN is dramatically more valuable for MH development than one requiring well/septic. 21st Century Mortgage strongly prefers financing land+home packages with municipal utilities. This data layer alone can surface land opportunities others miss. |
| :---- |

## **Supporting Data Sources**

* **TxGIO/TNRIS Land Parcels:** Statewide parcel boundaries with owner info (free download)

* **FEMA NFHL:** Flood zone boundaries for risk assessment

* **County CAD Data:** Property values, zoning, land use classifications

* **HUD Fair Market Rents:** Lot rent benchmarking by geography

# **Renewed Vision: AI-Powered Deal Intelligence**

## **From Data to Decisions**

The core insight is that raw data is useless without analysis. DealForge should not just be a data aggregator—it should be an intelligent deal-finding assistant that synthesizes multiple data sources to surface actionable opportunities.

### **Three Pillars of Intelligence**

**1\. Park Acquisition Intelligence**

* Identify existing parks from title clustering patterns

* Score parks by distress signals (tax liens, aging homes, declining titlings)

* Track ownership changes and off-market indicators

* AI analysis of park potential based on infrastructure, market, demographics

**2\. Land Development Intelligence**

* Surface parcels with optimal development characteristics:

  * Inside water/sewer CCN (no well/septic needed)

  * Outside flood zones (reduced insurance/risk)

  * Appropriate zoning or re-zoning potential

  * Strong market demand (titling activity trends)

* Feasibility scoring for new MH community development

**3\. Market Intelligence**

* County/region market momentum from titling trends

* Supply/demand analysis (homes placed vs. land available)

* Competitive landscape (other RBIs, retailers active in area)

* Demographic overlays predicting future demand

# **AI-Powered Feature Concepts**

## **Deal Scout AI**

An AI assistant that actively searches for deals matching your criteria. Instead of manually scanning maps and filtering data, describe what you're looking for:

| Example Query "Find me distressed mobile home parks in South Texas counties with at least 20 lots, within a water CCN, where the owner has accumulated tax liens in the past 2 years." |
| :---- |

The AI would synthesize TDHCA ownership data, tax lien records, CCN boundaries, and county data to return a ranked list of opportunities with analysis.

## **Parcel Analysis AI**

Point at any parcel on the map and get instant AI analysis:

* **Development feasibility score** (based on utilities, flood, zoning, access)

* **Estimated development costs** (rough pro forma based on lot count potential)

* **Market fit analysis** (demand indicators, competition, rent potential)

* **Risk factors** (flood proximity, environmental concerns, zoning challenges)

## **Due Diligence Assistant**

When you identify a deal, the AI helps you through the due diligence process:

* Automatically pulls all TDHCA records for homes in the park

* Checks for outstanding tax liens

* Verifies utility service availability

* Generates flood zone report

* Creates preliminary underwriting model

# **Implementation Roadmap**

## **Phase 1: Data Foundation (Weeks 1-4)**

Build the data ingestion and storage layer to power all downstream features.

### **TDHCA Data Pipeline**

1. Build scraper/downloader for TDHCA ownership records CSV

2. Build parser for tax lien records

3. Build license holder database sync

4. Implement park detection algorithm (cluster titles by address)

### **Infrastructure Data Pipeline**

5. Download and process PUC CCN shapefiles (water \+ sewer)

6. Import to PostGIS for spatial queries

7. Build API endpoints for "is this point in a CCN" queries

## **Phase 2: Map Intelligence (Weeks 5-8)**

Create the visual layer that makes data explorable.

* Interactive map with park pins (color-coded by distress score)

* Toggle layers: CCN water, CCN sewer, flood zones

* Park detail panel showing all aggregated intelligence

* County market dashboard with titling trends

## **Phase 3: AI Intelligence Layer (Weeks 9-12)**

Add the AI features that turn data into decisions.

* Deal Scout AI with natural language queries

* Parcel analysis AI with feasibility scoring

* Due diligence assistant with automated report generation

* Opportunity alerts (email/SMS when matches found)

## **Phase 4: Deal Workflow (Weeks 13-16)**

Complete the deal lifecycle from discovery to close.

* Saved deals library with status tracking

* Full underwriting calculator (park acquisition \+ land development)

* PDF export for lenders/partners

* 21st Century Mortgage integration checklist

# **Recommended First Epic: TDHCA Data Intelligence**

| Epic Goal Ingest TDHCA ownership and tax lien data, build park detection algorithm, and create the foundation for all AI-powered deal intelligence features. |
| :---- |

## **Why Start Here**

8. **Unique data advantage:** No competitor is systematically analyzing TDHCA data

9. **Foundation for AI:** Every AI feature depends on this data layer

10. **Immediate value:** Tax lien detection alone surfaces acquisition opportunities

11. **Builds database schema:** You already have the schema started in tdhca.ts

## **Epic Breakdown**

### **Story 1: TDHCA Ownership Data Ingestion**

**Acceptance Criteria:**

* Can download ownership records CSV from TDHCA by county

* Parse all fields into mh\_ownership\_records table

* Handle incremental updates (upsert by certificate number)

* Initial load for 5 target counties

### **Story 2: Tax Lien Data Ingestion**

**Acceptance Criteria:**

* Can download tax lien records from TDHCA

* Parse into mh\_tax\_liens table with amount, status, dates

* Link liens to ownership records by serial number

### **Story 3: Park Detection Algorithm**

**Acceptance Criteria:**

* Cluster ownership records by install address \+ city

* Flag addresses with 5+ homes as potential parks

* Geocode park addresses (batch via geocoding API)

* Create/update mh\_communities records from detected parks

### **Story 4: Distress Score Calculation**

**Acceptance Criteria:**

* Calculate distress score for each detected park based on:

  * Percentage of homes with active tax liens

  * Total lien amount relative to estimated park value

  * Average age of homes in park

  * Recent titling activity (declining \= higher distress)

* Store score on mh\_communities record

### **Story 5: Park Detail API**

**Acceptance Criteria:**

* API endpoint returns full park intelligence:

  * Basic info (name, address, lot count, distress score)

  * All MH ownership records at that address

  * Tax lien summary (count, total amount, breakdown)

  * Recent titling activity for the park

# **Next Steps**

12. **Review and approve this strategic direction** — ensure alignment with business goals

13. **Manually test TDHCA data downloads** — verify we can access ownership records and tax liens

14. **Begin Epic 1, Story 1** — build the ownership data ingestion pipeline

15. **Download PUC CCN shapefiles** — prepare for Phase 2 infrastructure layer

| The Vision DealForge becomes the first AI-powered deal intelligence platform for Texas mobile home investors and RBI developers—transforming publicly available data into a competitive advantage that surfaces opportunities others miss and accelerates the path from discovery to close. |
| :---- |

*— End of Document —*