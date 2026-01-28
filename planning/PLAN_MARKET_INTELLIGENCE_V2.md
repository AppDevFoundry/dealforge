# Market Intelligence & Dynamic UI - Implementation Plan

## Overview

This plan extends the AI Deal Scout with enriched market data from government APIs and introduces a dynamic UI rendering system that transforms AI responses into interactive visual components. The implementation leverages both the existing Next.js application and a new Go service for high-performance data synchronization.

---

## Table of Contents

1. [Goals & Objectives](#goals--objectives)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: Go Data Sync Service](#phase-1-go-data-sync-service)
4. [Phase 2: Market Data APIs](#phase-2-market-data-apis)
5. [Phase 3: New AI Tools](#phase-3-new-ai-tools)
6. [Phase 4: JSON-Render Dynamic UI](#phase-4-json-render-dynamic-ui)
7. [Phase 5: Just-In-Time Data Fetching](#phase-5-just-in-time-data-fetching)
8. [Phase 6: Verification & Testing](#phase-6-verification--testing)
9. [Deployment Strategy](#deployment-strategy)
10. [File Summary](#file-summary)

---

## Goals & Objectives

### Primary Goals

1. **Enrich deal analysis** with market context data (HUD rents, demographics, employment)
2. **Build Go expertise** by implementing the data sync service in Go
3. **Create dynamic visualizations** from AI responses using JSON-Render
4. **Enable just-in-time data fetching** for specific parcels/locations

### Success Criteria

- [ ] Go service successfully syncs HUD, Census, and BLS data
- [ ] AI Deal Scout can answer questions using market context
- [ ] AI responses render as interactive charts, tables, and cards
- [ ] User can ask "What's the market like around [address]?" and get real-time data

---

## Architecture Overview

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP                              │
│                       (apps/web)                                 │
├─────────────────────────────────────────────────────────────────┤
│  AI Deal Scout        │  API Routes        │  React UI           │
│  - 8 tools            │  - /api/v1/*       │  - Dashboard        │
│  - TDHCA data only    │  - /api/chat       │  - Park explorer    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEON POSTGRES + POSTGIS                       │
│  mh_communities │ mh_tax_liens │ ccn_areas │ (no market data)   │
└─────────────────────────────────────────────────────────────────┘
```

### Target State

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEXT.JS APP                              │
│                       (apps/web)                                 │
├─────────────────────────────────────────────────────────────────┤
│  AI Deal Scout        │  API Routes        │  JSON-Render UI     │
│  - 12+ tools          │  - /api/v1/*       │  - Dynamic charts   │
│  - Market context     │  - /api/chat       │  - Visual reports   │
│  - JIT data fetch     │  - /api/generate   │  - Component catalog│
└──────────────────────────────────────────────────────────────────┘
           │                     │
           ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEON POSTGRES + POSTGIS                       │
│  mh_communities │ mh_tax_liens │ ccn_areas │ market_data        │
│  hud_fmr        │ census_demographics      │ bls_employment     │
└─────────────────────────────────────────────────────────────────┘
           ▲
           │
┌─────────────────────────────────────────────────────────────────┐
│                    GO DATA SYNC SERVICE                          │
│                  (services/data-sync)                            │
├─────────────────────────────────────────────────────────────────┤
│  HUD Client     │  Census Client   │  BLS Client                │
│  Orchestrator   │  Database Writer │  Scheduler                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Go Data Sync Service

### 1.1 Overview

Expand the existing Go service skeleton (`services/data-sync`) to fetch data from government APIs and write to the database. This provides:

- **Performance**: Go excels at concurrent HTTP requests and data processing
- **Learning**: Opportunity to build Go skills with a real project
- **Separation**: Keep data sync concerns out of the Next.js app
- **Scheduling**: Can run as a standalone cron job or GitHub Action

### 1.2 Project Structure

```
services/data-sync/
├── cmd/
│   └── sync/
│       └── main.go              # Entry point (exists, expand)
├── internal/
│   ├── config/
│   │   └── config.go            # Configuration & env vars
│   ├── db/
│   │   ├── postgres.go          # Database connection pool
│   │   ├── market_data.go       # Market data write operations
│   │   └── migrations.go        # Ensure tables exist
│   ├── sources/
│   │   ├── hud/
│   │   │   ├── client.go        # HUD API client
│   │   │   ├── types.go         # HUD response types
│   │   │   └── parser.go        # Transform to DB schema
│   │   ├── census/
│   │   │   ├── client.go        # Census ACS client
│   │   │   ├── types.go         # Census response types
│   │   │   └── parser.go        # Transform to DB schema
│   │   └── bls/
│   │       ├── client.go        # BLS API client
│   │       ├── types.go         # BLS response types
│   │       └── parser.go        # Transform to DB schema
│   └── sync/
│       ├── orchestrator.go      # Coordinates all sync operations
│       ├── texas_zips.go        # Texas ZIP code list
│       └── progress.go          # Progress tracking & reporting
├── go.mod
├── go.sum
├── Dockerfile
└── README.md
```

### 1.3 Database Schema Additions

**File:** `packages/database/src/schema/market-data.ts`

```typescript
import { decimal, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// HUD Fair Market Rents by ZIP
export const hudFairMarketRents = pgTable('hud_fair_market_rents', {
  id: uuid('id').primaryKey().defaultRandom(),
  zipCode: text('zip_code').notNull(),
  countyName: text('county_name'),
  metroName: text('metro_name'),
  fiscalYear: integer('fiscal_year').notNull(),

  // Rent amounts by bedroom count
  efficiency: integer('efficiency'),      // 0 bedroom
  oneBedroom: integer('one_bedroom'),
  twoBedroom: integer('two_bedroom'),
  threeBedroom: integer('three_bedroom'),
  fourBedroom: integer('four_bedroom'),

  // Metadata
  areaName: text('area_name'),
  stateCode: text('state_code'),
  sourceUpdatedAt: timestamp('source_updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  zipYearIdx: index('hud_fmr_zip_year_idx').on(table.zipCode, table.fiscalYear),
  countyIdx: index('hud_fmr_county_idx').on(table.countyName),
}));

// Census Demographics by County/Tract
export const censusDemographics = pgTable('census_demographics', {
  id: uuid('id').primaryKey().defaultRandom(),
  geoId: text('geo_id').notNull(),        // FIPS code
  geoType: text('geo_type').notNull(),    // 'county', 'tract', 'zip'
  geoName: text('geo_name'),
  stateCode: text('state_code'),
  countyCode: text('county_code'),

  // Population
  totalPopulation: integer('total_population'),
  populationGrowthRate: decimal('population_growth_rate', { precision: 6, scale: 4 }),
  medianAge: decimal('median_age', { precision: 4, scale: 1 }),

  // Income
  medianHouseholdIncome: integer('median_household_income'),
  perCapitaIncome: integer('per_capita_income'),
  povertyRate: decimal('poverty_rate', { precision: 5, scale: 2 }),

  // Housing
  totalHousingUnits: integer('total_housing_units'),
  ownerOccupiedRate: decimal('owner_occupied_rate', { precision: 5, scale: 2 }),
  renterOccupiedRate: decimal('renter_occupied_rate', { precision: 5, scale: 2 }),
  vacancyRate: decimal('vacancy_rate', { precision: 5, scale: 2 }),
  medianHomeValue: integer('median_home_value'),
  medianGrossRent: integer('median_gross_rent'),

  // Mobile/Manufactured Housing specific
  mobileHomesCount: integer('mobile_homes_count'),
  mobileHomesPercent: decimal('mobile_homes_percent', { precision: 5, scale: 2 }),

  // Survey info
  surveyYear: integer('survey_year').notNull(),
  surveyType: text('survey_type'),        // 'acs5', 'acs1', 'decennial'
  marginOfError: decimal('margin_of_error', { precision: 5, scale: 2 }),

  // Metadata
  sourceUpdatedAt: timestamp('source_updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  geoIdx: index('census_geo_idx').on(table.geoId, table.surveyYear),
  countyIdx: index('census_county_idx').on(table.countyCode),
  geoTypeIdx: index('census_geo_type_idx').on(table.geoType),
}));

// BLS Employment Data by County
export const blsEmployment = pgTable('bls_employment', {
  id: uuid('id').primaryKey().defaultRandom(),
  areaCode: text('area_code').notNull(),   // FIPS code
  areaName: text('area_name'),
  stateCode: text('state_code'),
  countyCode: text('county_code'),

  // Employment metrics
  year: integer('year').notNull(),
  month: integer('month'),                  // null for annual data
  periodType: text('period_type'),          // 'monthly', 'annual'

  laborForce: integer('labor_force'),
  employed: integer('employed'),
  unemployed: integer('unemployed'),
  unemploymentRate: decimal('unemployment_rate', { precision: 5, scale: 2 }),

  // Employment by sector (optional, from QCEW)
  totalWages: decimal('total_wages', { precision: 15, scale: 2 }),
  avgWeeklyWage: integer('avg_weekly_wage'),
  establishmentCount: integer('establishment_count'),

  // Metadata
  preliminary: boolean('preliminary').default(false),
  sourceUpdatedAt: timestamp('source_updated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  areaYearIdx: index('bls_area_year_idx').on(table.areaCode, table.year, table.month),
  countyIdx: index('bls_county_idx').on(table.countyCode),
}));
```

### 1.4 Go Implementation Details

#### Config (`internal/config/config.go`)

```go
package config

import (
	"fmt"
	"os"
)

type Config struct {
	DatabaseURL   string
	HUDAPIKey     string
	CensusAPIKey  string
	BLSAPIKey     string  // Optional, higher rate limits with key

	// Sync options
	ConcurrentRequests int
	RetryAttempts      int
	RetryDelaySeconds  int
}

func Load() (*Config, error) {
	cfg := &Config{
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		HUDAPIKey:          os.Getenv("HUD_API_KEY"),
		CensusAPIKey:       os.Getenv("CENSUS_API_KEY"),
		BLSAPIKey:          os.Getenv("BLS_API_KEY"),
		ConcurrentRequests: 10,
		RetryAttempts:      3,
		RetryDelaySeconds:  5,
	}

	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	// HUD and Census keys are required, BLS is optional
	if cfg.HUDAPIKey == "" {
		return nil, fmt.Errorf("HUD_API_KEY is required (get from huduser.gov)")
	}
	if cfg.CensusAPIKey == "" {
		return nil, fmt.Errorf("CENSUS_API_KEY is required (get from census.gov)")
	}

	return cfg, nil
}
```

#### HUD Client (`internal/sources/hud/client.go`)

```go
package hud

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const baseURL = "https://www.huduser.gov/hudapi/public"

type Client struct {
	apiKey     string
	httpClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// FMRResponse represents the HUD Fair Market Rent API response
type FMRResponse struct {
	Data struct {
		BasicData struct {
			ZipCode     string `json:"zip_code"`
			CountyName  string `json:"county_name"`
			MetroName   string `json:"metro_name"`
			AreaName    string `json:"area_name"`
			StateID     string `json:"state_id"`
			FipsCode    string `json:"fips_code"`
			Year        int    `json:"year"`
			Efficiency  int    `json:"Efficiency"`
			OneBR       int    `json:"One-Bedroom"`
			TwoBR       int    `json:"Two-Bedroom"`
			ThreeBR     int    `json:"Three-Bedroom"`
			FourBR      int    `json:"Four-Bedroom"`
		} `json:"basicdata"`
	} `json:"data"`
}

// GetFMRByZIP fetches Fair Market Rent data for a ZIP code
func (c *Client) GetFMRByZIP(ctx context.Context, zipCode string) (*FMRResponse, error) {
	url := fmt.Sprintf("%s/fmr/data/%s", baseURL, zipCode)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	var fmrResp FMRResponse
	if err := json.NewDecoder(resp.Body).Decode(&fmrResp); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	return &fmrResp, nil
}
```

#### Census Client (`internal/sources/census/client.go`)

```go
package census

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const baseURL = "https://api.census.gov/data"

type Client struct {
	apiKey     string
	httpClient *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		apiKey: apiKey,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// ACS Variables we want to fetch
// See: https://api.census.gov/data/2022/acs/acs5/variables.html
var acsVariables = []string{
	"B01003_001E", // Total population
	"B01002_001E", // Median age
	"B19013_001E", // Median household income
	"B19301_001E", // Per capita income
	"B17001_002E", // Population below poverty
	"B25001_001E", // Total housing units
	"B25002_002E", // Occupied housing units
	"B25002_003E", // Vacant housing units
	"B25003_002E", // Owner occupied
	"B25003_003E", // Renter occupied
	"B25077_001E", // Median home value
	"B25064_001E", // Median gross rent
	"B25024_010E", // Mobile homes count
}

// GetCountyDemographics fetches ACS data for a Texas county
func (c *Client) GetCountyDemographics(ctx context.Context, countyFIPS string, year int) (map[string]interface{}, error) {
	// ACS 5-year estimates
	endpoint := fmt.Sprintf("%s/%d/acs/acs5", baseURL, year)

	params := url.Values{}
	params.Set("get", strings.Join(acsVariables, ","))
	params.Set("for", fmt.Sprintf("county:%s", countyFIPS))
	params.Set("in", "state:48") // Texas FIPS
	params.Set("key", c.apiKey)

	reqURL := fmt.Sprintf("%s?%s", endpoint, params.Encode())

	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("creating request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("executing request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
	}

	// Census API returns array of arrays: [headers, data]
	var result [][]string
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("decoding response: %w", err)
	}

	if len(result) < 2 {
		return nil, fmt.Errorf("no data returned for county %s", countyFIPS)
	}

	// Convert to map using headers
	headers := result[0]
	values := result[1]
	data := make(map[string]interface{})
	for i, header := range headers {
		if i < len(values) {
			data[header] = values[i]
		}
	}

	return data, nil
}
```

#### Orchestrator (`internal/sync/orchestrator.go`)

```go
package sync

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/dealforge/data-sync/internal/config"
	"github.com/dealforge/data-sync/internal/db"
	"github.com/dealforge/data-sync/internal/sources/bls"
	"github.com/dealforge/data-sync/internal/sources/census"
	"github.com/dealforge/data-sync/internal/sources/hud"
	"golang.org/x/sync/errgroup"
)

type Orchestrator struct {
	cfg        *config.Config
	db         *db.Client
	hudClient  *hud.Client
	censusClient *census.Client
	blsClient  *bls.Client
}

func NewOrchestrator(cfg *config.Config) (*Orchestrator, error) {
	dbClient, err := db.NewClient(cfg.DatabaseURL)
	if err != nil {
		return nil, err
	}

	return &Orchestrator{
		cfg:          cfg,
		db:           dbClient,
		hudClient:    hud.NewClient(cfg.HUDAPIKey),
		censusClient: census.NewClient(cfg.CensusAPIKey),
		blsClient:    bls.NewClient(cfg.BLSAPIKey),
	}, nil
}

type SyncResult struct {
	Source       string
	RecordsSynced int
	Errors       []error
	Duration     time.Duration
}

// SyncAll runs all data syncs in parallel
func (o *Orchestrator) SyncAll(ctx context.Context, zips []string, counties []string) ([]SyncResult, error) {
	slog.Info("starting full sync",
		"zip_count", len(zips),
		"county_count", len(counties),
	)

	var results []SyncResult
	var mu sync.Mutex

	g, ctx := errgroup.WithContext(ctx)

	// Sync HUD FMR data by ZIP
	g.Go(func() error {
		result := o.syncHUD(ctx, zips)
		mu.Lock()
		results = append(results, result)
		mu.Unlock()
		return nil
	})

	// Sync Census data by county
	g.Go(func() error {
		result := o.syncCensus(ctx, counties)
		mu.Lock()
		results = append(results, result)
		mu.Unlock()
		return nil
	})

	// Sync BLS data by county
	g.Go(func() error {
		result := o.syncBLS(ctx, counties)
		mu.Lock()
		results = append(results, result)
		mu.Unlock()
		return nil
	})

	if err := g.Wait(); err != nil {
		return results, err
	}

	return results, nil
}

func (o *Orchestrator) syncHUD(ctx context.Context, zips []string) SyncResult {
	start := time.Now()
	result := SyncResult{Source: "HUD FMR"}

	slog.Info("syncing HUD Fair Market Rents", "zip_count", len(zips))

	// Use semaphore for rate limiting
	sem := make(chan struct{}, o.cfg.ConcurrentRequests)
	var wg sync.WaitGroup
	var mu sync.Mutex

	for _, zip := range zips {
		wg.Add(1)
		go func(z string) {
			defer wg.Done()

			sem <- struct{}{}
			defer func() { <-sem }()

			fmr, err := o.hudClient.GetFMRByZIP(ctx, z)
			if err != nil {
				mu.Lock()
				result.Errors = append(result.Errors, err)
				mu.Unlock()
				return
			}

			if err := o.db.UpsertHUDFMR(ctx, fmr); err != nil {
				mu.Lock()
				result.Errors = append(result.Errors, err)
				mu.Unlock()
				return
			}

			mu.Lock()
			result.RecordsSynced++
			mu.Unlock()
		}(zip)
	}

	wg.Wait()
	result.Duration = time.Since(start)

	slog.Info("HUD sync complete",
		"records", result.RecordsSynced,
		"errors", len(result.Errors),
		"duration", result.Duration,
	)

	return result
}

func (o *Orchestrator) syncCensus(ctx context.Context, counties []string) SyncResult {
	start := time.Now()
	result := SyncResult{Source: "Census ACS"}

	slog.Info("syncing Census demographics", "county_count", len(counties))

	for _, county := range counties {
		data, err := o.censusClient.GetCountyDemographics(ctx, county, 2022)
		if err != nil {
			result.Errors = append(result.Errors, err)
			continue
		}

		if err := o.db.UpsertCensusDemographics(ctx, county, data); err != nil {
			result.Errors = append(result.Errors, err)
			continue
		}

		result.RecordsSynced++
	}

	result.Duration = time.Since(start)

	slog.Info("Census sync complete",
		"records", result.RecordsSynced,
		"errors", len(result.Errors),
		"duration", result.Duration,
	)

	return result
}

func (o *Orchestrator) syncBLS(ctx context.Context, counties []string) SyncResult {
	start := time.Now()
	result := SyncResult{Source: "BLS Employment"}

	slog.Info("syncing BLS employment data", "county_count", len(counties))

	for _, county := range counties {
		data, err := o.blsClient.GetCountyEmployment(ctx, county)
		if err != nil {
			result.Errors = append(result.Errors, err)
			continue
		}

		if err := o.db.UpsertBLSEmployment(ctx, county, data); err != nil {
			result.Errors = append(result.Errors, err)
			continue
		}

		result.RecordsSynced++
	}

	result.Duration = time.Since(start)

	slog.Info("BLS sync complete",
		"records", result.RecordsSynced,
		"errors", len(result.Errors),
		"duration", result.Duration,
	)

	return result
}
```

### 1.5 Running the Go Service

#### Local Development

```bash
cd services/data-sync

# Set environment variables
export DATABASE_URL="postgresql://..."
export HUD_API_KEY="your_key"
export CENSUS_API_KEY="your_key"

# Run sync for specific ZIPs
go run ./cmd/sync --zips="78201,78202,78203"

# Run sync from ZIP file
go run ./cmd/sync --zip-file=texas_zips.txt

# Build binary
go build -o bin/sync ./cmd/sync
```

#### GitHub Actions Scheduled Sync

**File:** `.github/workflows/data-sync.yml`

```yaml
name: Market Data Sync

on:
  schedule:
    # Run weekly on Sunday at 2 AM UTC
    - cron: '0 2 * * 0'
  workflow_dispatch:
    inputs:
      source:
        description: 'Data source to sync'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - hud
          - census
          - bls

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Build sync service
        working-directory: services/data-sync
        run: go build -o sync ./cmd/sync

      - name: Run sync
        working-directory: services/data-sync
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          HUD_API_KEY: ${{ secrets.HUD_API_KEY }}
          CENSUS_API_KEY: ${{ secrets.CENSUS_API_KEY }}
          BLS_API_KEY: ${{ secrets.BLS_API_KEY }}
        run: |
          ./sync --source=${{ inputs.source || 'all' }}
```

### 1.6 Deployment Options

#### Option A: GitHub Actions Only (Recommended for Start)

- No infrastructure to manage
- Free for public repos, included minutes for private
- Runs on schedule or manual trigger
- Perfect for weekly/monthly syncs

#### Option B: Vercel Cron Functions

If you need more frequent syncs or want everything in Vercel:

```typescript
// apps/web/app/api/cron/market-sync/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Call Go service via HTTP or run inline sync
  // ...
}
```

#### Option C: Fly.io (If You Need Long-Running Jobs)

```dockerfile
# services/data-sync/Dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /sync ./cmd/sync

FROM alpine:latest
RUN apk --no-cache add ca-certificates
COPY --from=builder /sync /sync
ENTRYPOINT ["/sync"]
```

**Recommendation:** Start with GitHub Actions. It's zero infrastructure and works well for data that updates weekly or monthly.

---

## Phase 2: Market Data APIs

### 2.1 API Keys Required

| Source | Key Required | Get From | Rate Limits |
|--------|--------------|----------|-------------|
| **HUD** | Yes | https://www.huduser.gov/hudapi/public/register | 100 req/min |
| **Census** | Yes | https://api.census.gov/data/key_signup.html | 500 req/day without key, unlimited with |
| **BLS** | Optional | https://data.bls.gov/registrationEngine/ | Higher limits with key |

### 2.2 Data Points Available

#### HUD Fair Market Rents

```json
{
  "zip_code": "78201",
  "county_name": "Bexar County",
  "metro_name": "San Antonio-New Braunfels, TX HUD Metro FMR Area",
  "year": 2024,
  "Efficiency": 904,
  "One-Bedroom": 1031,
  "Two-Bedroom": 1285,
  "Three-Bedroom": 1748,
  "Four-Bedroom": 2143
}
```

**Use Case:** Benchmark lot rents against housing costs. If FMR for a 2BR is $1,285/mo and lot rent is $450/mo, that's strong value proposition.

#### Census ACS Demographics

Key variables for MH park analysis:

| Variable | Description | Why It Matters |
|----------|-------------|----------------|
| `B01003_001E` | Total population | Market size |
| `B19013_001E` | Median household income | Affordability proxy |
| `B25024_010E` | Mobile homes count | MH market penetration |
| `B25064_001E` | Median gross rent | Rent benchmarking |
| `B17001_002E` | Population in poverty | Target demographic |
| `B25002_003E` | Vacant housing units | Market tightness |

#### BLS Employment

- Unemployment rate (leading indicator for rent collection)
- Labor force size (market stability)
- Average weekly wage (income verification)

### 2.3 Next.js API Routes for Market Data

**File:** `apps/web/app/api/v1/market-data/route.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zipCode = searchParams.get('zip');
  const county = searchParams.get('county');

  const sql = neon(process.env.DATABASE_URL!);

  const results: Record<string, unknown> = {};

  // Get HUD FMR data
  if (zipCode) {
    const fmr = await sql`
      SELECT * FROM hud_fair_market_rents
      WHERE zip_code = ${zipCode}
      ORDER BY fiscal_year DESC
      LIMIT 1
    `;
    results.fairMarketRents = fmr[0] || null;
  }

  // Get Census demographics
  if (county) {
    const census = await sql`
      SELECT * FROM census_demographics
      WHERE UPPER(geo_name) LIKE ${`%${county.toUpperCase()}%`}
      AND geo_type = 'county'
      ORDER BY survey_year DESC
      LIMIT 1
    `;
    results.demographics = census[0] || null;
  }

  // Get BLS employment
  if (county) {
    const bls = await sql`
      SELECT * FROM bls_employment
      WHERE UPPER(area_name) LIKE ${`%${county.toUpperCase()}%`}
      ORDER BY year DESC, month DESC NULLS LAST
      LIMIT 1
    `;
    results.employment = bls[0] || null;
  }

  return NextResponse.json(results);
}
```

---

## Phase 3: New AI Tools

### 3.1 Tool: getMarketContext

**File:** `apps/web/lib/ai/tools/get-market-context.ts`

```typescript
/**
 * Get Market Context Tool
 *
 * Fetches HUD, Census, and BLS data for a location to provide
 * market context for deal analysis.
 */

import { neon } from '@neondatabase/serverless';
import { tool } from 'ai';
import { z } from 'zod';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

const getMarketContextSchema = z.object({
  zipCode: z.string().optional().describe('5-digit ZIP code'),
  county: z.string().optional().describe('Texas county name'),
  includeHistorical: z.boolean().default(false).describe('Include prior year data for trends'),
});

type GetMarketContextParams = z.infer<typeof getMarketContextSchema>;

export const getMarketContext = tool({
  description: `Get market context data including Fair Market Rents (HUD), demographics (Census),
and employment data (BLS) for a Texas location. Use this to understand the economic
conditions and housing market around a mobile home park.`,
  inputSchema: getMarketContextSchema,
  execute: async (params: GetMarketContextParams) => {
    const { zipCode, county, includeHistorical } = params;
    const sql = getSql();

    if (!zipCode && !county) {
      return { error: 'Either zipCode or county is required' };
    }

    const response: Record<string, unknown> = {
      location: { zipCode, county },
      dataAsOf: new Date().toISOString(),
    };

    // Fetch HUD Fair Market Rents
    if (zipCode) {
      const limit = includeHistorical ? 3 : 1;
      const fmrRows = await sql`
        SELECT
          zip_code,
          county_name,
          metro_name,
          fiscal_year,
          efficiency,
          one_bedroom,
          two_bedroom,
          three_bedroom,
          four_bedroom
        FROM hud_fair_market_rents
        WHERE zip_code = ${zipCode}
        ORDER BY fiscal_year DESC
        LIMIT ${limit}
      `;

      if (fmrRows.length > 0) {
        response.fairMarketRents = {
          current: {
            year: fmrRows[0].fiscal_year,
            efficiency: fmrRows[0].efficiency,
            oneBedroom: fmrRows[0].one_bedroom,
            twoBedroom: fmrRows[0].two_bedroom,
            threeBedroom: fmrRows[0].three_bedroom,
            fourBedroom: fmrRows[0].four_bedroom,
          },
          countyName: fmrRows[0].county_name,
          metroArea: fmrRows[0].metro_name,
          historical: includeHistorical ? fmrRows.slice(1).map(r => ({
            year: r.fiscal_year,
            twoBedroom: r.two_bedroom,
          })) : undefined,
        };

        // Calculate YoY change if historical data exists
        if (includeHistorical && fmrRows.length >= 2) {
          const currentRent = fmrRows[0].two_bedroom as number;
          const priorRent = fmrRows[1].two_bedroom as number;
          if (priorRent > 0) {
            response.fairMarketRents.yoyChange =
              Math.round(((currentRent - priorRent) / priorRent) * 1000) / 10;
          }
        }
      }
    }

    // Fetch Census Demographics
    const countyName = county || (response.fairMarketRents as any)?.countyName?.replace(' County', '');
    if (countyName) {
      const censusRows = await sql`
        SELECT
          geo_name,
          total_population,
          population_growth_rate,
          median_age,
          median_household_income,
          per_capita_income,
          poverty_rate,
          total_housing_units,
          owner_occupied_rate,
          renter_occupied_rate,
          vacancy_rate,
          median_home_value,
          median_gross_rent,
          mobile_homes_count,
          mobile_homes_percent,
          survey_year
        FROM census_demographics
        WHERE UPPER(geo_name) LIKE ${`%${countyName.toUpperCase()}%`}
        AND geo_type = 'county'
        ORDER BY survey_year DESC
        LIMIT 1
      `;

      if (censusRows.length > 0) {
        const c = censusRows[0];
        response.demographics = {
          surveyYear: c.survey_year,
          population: {
            total: c.total_population,
            growthRate: c.population_growth_rate,
            medianAge: c.median_age,
          },
          income: {
            medianHousehold: c.median_household_income,
            perCapita: c.per_capita_income,
            povertyRate: c.poverty_rate,
          },
          housing: {
            totalUnits: c.total_housing_units,
            ownerOccupiedRate: c.owner_occupied_rate,
            renterOccupiedRate: c.renter_occupied_rate,
            vacancyRate: c.vacancy_rate,
            medianHomeValue: c.median_home_value,
            medianRent: c.median_gross_rent,
          },
          mobileHousing: {
            count: c.mobile_homes_count,
            percentOfTotal: c.mobile_homes_percent,
          },
        };
      }
    }

    // Fetch BLS Employment
    if (countyName) {
      const blsRows = await sql`
        SELECT
          area_name,
          year,
          month,
          labor_force,
          employed,
          unemployed,
          unemployment_rate,
          avg_weekly_wage
        FROM bls_employment
        WHERE UPPER(area_name) LIKE ${`%${countyName.toUpperCase()}%`}
        ORDER BY year DESC, month DESC NULLS LAST
        LIMIT 3
      `;

      if (blsRows.length > 0) {
        const latest = blsRows[0];
        response.employment = {
          asOf: latest.month
            ? `${latest.year}-${String(latest.month).padStart(2, '0')}`
            : `${latest.year} Annual`,
          laborForce: latest.labor_force,
          employed: latest.employed,
          unemployed: latest.unemployed,
          unemploymentRate: latest.unemployment_rate,
          avgWeeklyWage: latest.avg_weekly_wage,
          trend: blsRows.slice(1).map(r => ({
            period: r.month ? `${r.year}-${String(r.month).padStart(2, '0')}` : `${r.year}`,
            unemploymentRate: r.unemployment_rate,
          })),
        };
      }
    }

    // Generate market insights
    response.insights = generateMarketInsights(response);

    return response;
  },
});

function generateMarketInsights(data: Record<string, unknown>): string[] {
  const insights: string[] = [];

  const fmr = data.fairMarketRents as any;
  const demo = data.demographics as any;
  const emp = data.employment as any;

  // FMR insights
  if (fmr?.current?.twoBedroom) {
    const rent = fmr.current.twoBedroom;
    insights.push(`Fair Market Rent for 2BR is $${rent}/mo - lot rent should be competitive at 30-40% of this (~$${Math.round(rent * 0.35)}/mo)`);

    if (fmr.yoyChange) {
      const direction = fmr.yoyChange > 0 ? 'increased' : 'decreased';
      insights.push(`FMR has ${direction} ${Math.abs(fmr.yoyChange)}% year-over-year`);
    }
  }

  // Demographics insights
  if (demo?.income?.medianHousehold) {
    const income = demo.income.medianHousehold;
    const affordableLotRent = Math.round((income / 12) * 0.30); // 30% rule
    insights.push(`Median household income of $${income.toLocaleString()}/yr suggests affordable lot rent up to $${affordableLotRent}/mo`);
  }

  if (demo?.mobileHousing?.percentOfTotal > 5) {
    insights.push(`Mobile homes represent ${demo.mobileHousing.percentOfTotal}% of housing - strong MH market presence`);
  }

  if (demo?.housing?.vacancyRate < 5) {
    insights.push(`Low vacancy rate of ${demo.housing.vacancyRate}% indicates tight housing market`);
  }

  // Employment insights
  if (emp?.unemploymentRate) {
    const rate = emp.unemploymentRate;
    if (rate < 4) {
      insights.push(`Unemployment rate of ${rate}% indicates strong job market`);
    } else if (rate > 6) {
      insights.push(`Elevated unemployment rate of ${rate}% may impact rent collection`);
    }
  }

  return insights;
}
```

### 3.2 Tool: lookupParcelData

**File:** `apps/web/lib/ai/tools/lookup-parcel-data.ts`

```typescript
/**
 * Lookup Parcel Data Tool
 *
 * Just-in-time lookup of data for a specific location.
 * Fetches fresh data from APIs if not in database.
 */

import { neon } from '@neondatabase/serverless';
import { tool } from 'ai';
import { z } from 'zod';

const lookupParcelDataSchema = z.object({
  address: z.string().optional().describe('Street address to lookup'),
  zipCode: z.string().optional().describe('5-digit ZIP code'),
  latitude: z.number().optional().describe('Latitude coordinate'),
  longitude: z.number().optional().describe('Longitude coordinate'),
});

export const lookupParcelData = tool({
  description: `Look up detailed data for a specific parcel or location. This performs
just-in-time lookups and can geocode addresses. Use when a user asks about a
specific property or location and you need current, detailed information.`,
  inputSchema: lookupParcelDataSchema,
  execute: async (params) => {
    const { address, zipCode, latitude, longitude } = params;
    const sql = neon(process.env.DATABASE_URL!);

    let coords = { lat: latitude, lng: longitude };
    let resolvedZip = zipCode;

    // Geocode address if provided
    if (address && (!latitude || !longitude)) {
      const geocoded = await geocodeAddress(address);
      if (geocoded) {
        coords = geocoded.coords;
        resolvedZip = geocoded.zipCode || zipCode;
      }
    }

    const results: Record<string, unknown> = {
      location: {
        address,
        zipCode: resolvedZip,
        coordinates: coords.lat && coords.lng ? coords : null,
      },
    };

    // Check CCN coverage (water/sewer)
    if (coords.lat && coords.lng) {
      const ccnCheck = await sql`
        SELECT
          ccn_number,
          utility_name,
          service_type
        FROM ccn_areas
        WHERE ST_Contains(
          boundary::geometry,
          ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)
        )
      `;

      results.utilities = {
        waterService: ccnCheck.find(c => c.service_type === 'water' || c.service_type === 'both'),
        sewerService: ccnCheck.find(c => c.service_type === 'sewer' || c.service_type === 'both'),
        hasMunicipalWater: ccnCheck.some(c => c.service_type === 'water' || c.service_type === 'both'),
        hasMunicipalSewer: ccnCheck.some(c => c.service_type === 'sewer' || c.service_type === 'both'),
      };

      // Utility insight
      if (!results.utilities.hasMunicipalWater || !results.utilities.hasMunicipalSewer) {
        results.utilities.warning = 'Location may require private well/septic - verify with due diligence';
      }
    }

    // Get market data for ZIP
    if (resolvedZip) {
      const fmr = await sql`
        SELECT fiscal_year, two_bedroom, county_name
        FROM hud_fair_market_rents
        WHERE zip_code = ${resolvedZip}
        ORDER BY fiscal_year DESC
        LIMIT 1
      `;

      if (fmr.length > 0) {
        results.marketRents = {
          fiscalYear: fmr[0].fiscal_year,
          twoBedroom: fmr[0].two_bedroom,
          county: fmr[0].county_name,
        };
      }
    }

    // Find nearby parks
    if (coords.lat && coords.lng) {
      const nearbyParks = await sql`
        SELECT
          id,
          name,
          address,
          lot_count,
          distress_score,
          ST_Distance(
            location::geometry,
            ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)
          ) * 111139 as distance_meters
        FROM mh_communities
        WHERE ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)::geography,
          16093  -- 10 miles in meters
        )
        ORDER BY distance_meters
        LIMIT 5
      `;

      results.nearbyParks = nearbyParks.map(p => ({
        id: p.id,
        name: p.name,
        address: p.address,
        lotCount: p.lot_count,
        distressScore: p.distress_score,
        distanceMiles: Math.round((p.distance_meters / 1609.34) * 10) / 10,
      }));
    }

    return results;
  },
});

async function geocodeAddress(address: string): Promise<{
  coords: { lat: number; lng: number };
  zipCode?: string;
} | null> {
  // Use Mapbox geocoding API
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) return null;

  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
      `access_token=${token}&country=US&types=address`
    );

    const data = await response.json();
    if (data.features?.length > 0) {
      const feature = data.features[0];
      const [lng, lat] = feature.center;

      // Extract ZIP from context
      const zipContext = feature.context?.find((c: any) => c.id.startsWith('postcode'));

      return {
        coords: { lat, lng },
        zipCode: zipContext?.text,
      };
    }
  } catch (e) {
    console.error('Geocoding failed:', e);
  }

  return null;
}
```

### 3.3 Update Tools Index

**File:** `apps/web/lib/ai/tools/index.ts`

```typescript
/**
 * AI Tools Registry
 *
 * Exports all Deal Scout tools for use with the Vercel AI SDK.
 */

import { analyzeDeal } from './analyze-deal';
import { compareParksByCounty } from './compare-parks-by-county';
import { getDataRefreshStatus } from './get-data-refresh-status';
import { getMarketContext } from './get-market-context';
import { getMarketOverview } from './get-market-overview';
import { getParkDetails } from './get-park-details';
import { getParkLienHistory } from './get-park-lien-history';
import { lookupParcelData } from './lookup-parcel-data';
import { refreshTdhcaData } from './refresh-tdhca-data';
import { searchDistressedParks } from './search-distressed-parks';

/**
 * All Deal Scout tools bundled for use with streamText
 */
export const dealScoutTools = {
  // Discovery & Search
  searchDistressedParks,
  getParkDetails,
  getParkLienHistory,

  // Market Intelligence (NEW)
  getMarketContext,
  lookupParcelData,

  // Analysis
  analyzeDeal,
  compareParksByCounty,
  getMarketOverview,

  // Data Management
  refreshTdhcaData,
  getDataRefreshStatus,
};

// Re-export individual tools for granular use
export {
  searchDistressedParks,
  getParkDetails,
  getParkLienHistory,
  getMarketContext,
  lookupParcelData,
  analyzeDeal,
  compareParksByCounty,
  getMarketOverview,
  refreshTdhcaData,
  getDataRefreshStatus,
};
```

### 3.4 Update System Prompt

**File:** `apps/web/app/api/chat/route.ts` (update system prompt)

```typescript
const systemPrompt = `You are Deal Scout, an AI assistant specializing in mobile home park acquisitions in Texas.

You help investors identify distressed properties by analyzing tax lien data, ownership records, market conditions, and economic indicators.

## Your Capabilities

**Discovery & Search:**
- searchDistressedParks: Find parks by county, distress score, lot count
- getParkDetails: Get comprehensive park information
- getParkLienHistory: View tax lien history

**Market Intelligence (Use these to provide context!):**
- getMarketContext: Get HUD Fair Market Rents, Census demographics, BLS employment data
- lookupParcelData: Just-in-time lookup for specific addresses, includes CCN utility coverage

**Analysis:**
- analyzeDeal: Run financial projections with market-aware assumptions
- compareParksByCounty: Compare distress metrics across counties
- getMarketOverview: Get aggregate market statistics

**Data Management:**
- refreshTdhcaData: Trigger data refresh from TDHCA
- getDataRefreshStatus: Check refresh job status

## Analysis Best Practices

When analyzing a deal, always:
1. Use getMarketContext to understand the local market
2. Compare lot rents to Fair Market Rents (lot rent should be ~30-40% of 2BR FMR)
3. Consider unemployment rate when projecting occupancy
4. Note if median household income supports the lot rent
5. Check utility coverage with lookupParcelData

Be data-driven. Always cite specific numbers. Highlight both opportunities and risks.`;
```

---

## Phase 4: JSON-Render Dynamic UI

### 4.1 Overview

JSON-Render enables the AI to generate structured UI components that render dynamically. Instead of just text responses, the AI can produce charts, tables, cards, and dashboards.

### 4.2 Installation

```bash
cd apps/web
pnpm add @json-render/core @json-render/react
```

### 4.3 Component Catalog Definition

**File:** `apps/web/lib/ui-catalog/catalog.ts`

```typescript
/**
 * Deal Scout UI Component Catalog
 *
 * Defines the components that the AI can generate.
 * Uses Zod schemas for type-safe validation.
 */

import { createCatalog } from '@json-render/core';
import { z } from 'zod';

export const dealScoutCatalog = createCatalog({
  components: {
    // Layout Components
    Card: {
      props: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        variant: z.enum(['default', 'success', 'warning', 'danger']).optional(),
      }),
      hasChildren: true,
    },

    Grid: {
      props: z.object({
        columns: z.number().min(1).max(4).default(2),
        gap: z.enum(['sm', 'md', 'lg']).default('md'),
      }),
      hasChildren: true,
    },

    // Data Display Components
    Stat: {
      props: z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
        unit: z.string().optional(),
        change: z.number().optional(),
        changeLabel: z.string().optional(),
        icon: z.enum(['dollar', 'home', 'users', 'trending-up', 'trending-down', 'alert']).optional(),
      }),
      hasChildren: false,
    },

    Table: {
      props: z.object({
        columns: z.array(z.object({
          key: z.string(),
          label: z.string(),
          align: z.enum(['left', 'center', 'right']).optional(),
          format: z.enum(['text', 'number', 'currency', 'percent']).optional(),
        })),
        data: z.array(z.record(z.unknown())),
        striped: z.boolean().optional(),
      }),
      hasChildren: false,
    },

    // Chart Components
    BarChart: {
      props: z.object({
        title: z.string().optional(),
        data: z.array(z.object({
          label: z.string(),
          value: z.number(),
          color: z.string().optional(),
        })),
        xAxisLabel: z.string().optional(),
        yAxisLabel: z.string().optional(),
        horizontal: z.boolean().optional(),
      }),
      hasChildren: false,
    },

    LineChart: {
      props: z.object({
        title: z.string().optional(),
        data: z.array(z.object({
          label: z.string(),
          value: z.number(),
        })),
        xAxisLabel: z.string().optional(),
        yAxisLabel: z.string().optional(),
        showArea: z.boolean().optional(),
      }),
      hasChildren: false,
    },

    PieChart: {
      props: z.object({
        title: z.string().optional(),
        data: z.array(z.object({
          label: z.string(),
          value: z.number(),
          color: z.string().optional(),
        })),
        showLegend: z.boolean().optional(),
        donut: z.boolean().optional(),
      }),
      hasChildren: false,
    },

    // MH Park Specific Components
    ParkCard: {
      props: z.object({
        parkId: z.string(),
        name: z.string(),
        address: z.string(),
        county: z.string(),
        lotCount: z.number().optional(),
        distressScore: z.number().optional(),
        activeLiens: z.number().optional(),
        totalDebt: z.number().optional(),
      }),
      hasChildren: false,
    },

    DealSummary: {
      props: z.object({
        parkName: z.string(),
        purchasePrice: z.number(),
        lotCount: z.number(),
        pricePerLot: z.number(),
        noi: z.number(),
        capRate: z.number(),
        cashOnCash: z.number(),
        recommendation: z.enum(['strong_buy', 'buy', 'hold', 'pass', 'avoid']),
        highlights: z.array(z.string()),
        concerns: z.array(z.string()),
      }),
      hasChildren: false,
    },

    MarketSnapshot: {
      props: z.object({
        county: z.string(),
        fairMarketRent: z.number().optional(),
        medianIncome: z.number().optional(),
        unemploymentRate: z.number().optional(),
        mobileHomePercent: z.number().optional(),
        insights: z.array(z.string()).optional(),
      }),
      hasChildren: false,
    },

    // Interactive Components
    ComparisonTable: {
      props: z.object({
        title: z.string().optional(),
        items: z.array(z.object({
          name: z.string(),
          metrics: z.record(z.union([z.string(), z.number()])),
        })),
        highlightBest: z.boolean().optional(),
      }),
      hasChildren: false,
    },

    AlertBanner: {
      props: z.object({
        type: z.enum(['info', 'success', 'warning', 'error']),
        title: z.string(),
        message: z.string(),
        action: z.object({
          label: z.string(),
          actionId: z.string(),
        }).optional(),
      }),
      hasChildren: false,
    },
  },

  actions: {
    view_park_details: {
      description: 'Navigate to park detail page',
      parameters: z.object({ parkId: z.string() }),
    },
    run_analysis: {
      description: 'Run deal analysis on a park',
      parameters: z.object({ parkId: z.string() }),
    },
    export_report: {
      description: 'Export analysis as PDF',
      parameters: z.object({ format: z.enum(['pdf', 'csv']) }),
    },
    refresh_data: {
      description: 'Refresh market data',
      parameters: z.object({ source: z.enum(['hud', 'census', 'bls', 'all']) }),
    },
  },
});

export type DealScoutCatalog = typeof dealScoutCatalog;
```

### 4.4 Component Implementations

**File:** `apps/web/lib/ui-catalog/components/stat.tsx`

```typescript
'use client';

import { cn } from '@/lib/utils';
import {
  DollarSign,
  Home,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';

interface StatProps {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  icon?: 'dollar' | 'home' | 'users' | 'trending-up' | 'trending-down' | 'alert';
}

const iconMap = {
  dollar: DollarSign,
  home: Home,
  users: Users,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  alert: AlertTriangle,
};

export function Stat({ label, value, unit, change, changeLabel, icon }: StatProps) {
  const Icon = icon ? iconMap[icon] : null;

  const formattedValue = typeof value === 'number'
    ? value.toLocaleString()
    : value;

  return (
    <div className="bg-card rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold">{formattedValue}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      {change !== undefined && (
        <div className="mt-1 flex items-center gap-1">
          {change >= 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span className={cn(
            'text-xs',
            change >= 0 ? 'text-green-500' : 'text-red-500'
          )}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
          {changeLabel && (
            <span className="text-xs text-muted-foreground">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}
```

**File:** `apps/web/lib/ui-catalog/components/deal-summary.tsx`

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealSummaryProps {
  parkName: string;
  purchasePrice: number;
  lotCount: number;
  pricePerLot: number;
  noi: number;
  capRate: number;
  cashOnCash: number;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'pass' | 'avoid';
  highlights: string[];
  concerns: string[];
}

const recommendationConfig = {
  strong_buy: { label: 'Strong Buy', color: 'bg-green-500', icon: CheckCircle2 },
  buy: { label: 'Buy', color: 'bg-green-400', icon: CheckCircle2 },
  hold: { label: 'Hold', color: 'bg-yellow-500', icon: AlertCircle },
  pass: { label: 'Pass', color: 'bg-orange-500', icon: AlertCircle },
  avoid: { label: 'Avoid', color: 'bg-red-500', icon: XCircle },
};

export function DealSummary({
  parkName,
  purchasePrice,
  lotCount,
  pricePerLot,
  noi,
  capRate,
  cashOnCash,
  recommendation,
  highlights,
  concerns,
}: DealSummaryProps) {
  const rec = recommendationConfig[recommendation];
  const RecIcon = rec.icon;

  return (
    <Card className="overflow-hidden">
      <CardHeader className={cn('text-white', rec.color)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{parkName}</CardTitle>
          <Badge variant="secondary" className="flex items-center gap-1">
            <RecIcon className="h-4 w-4" />
            {rec.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="text-sm text-muted-foreground">Purchase Price</div>
            <div className="text-lg font-semibold">${purchasePrice.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Price/Lot</div>
            <div className="text-lg font-semibold">${pricePerLot.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Cap Rate</div>
            <div className="text-lg font-semibold">{capRate.toFixed(1)}%</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Cash-on-Cash</div>
            <div className="text-lg font-semibold">{cashOnCash.toFixed(1)}%</div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {highlights.length > 0 && (
            <div>
              <div className="text-sm font-medium text-green-600">Highlights</div>
              <ul className="mt-1 space-y-1">
                {highlights.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-3 w-3 text-green-500" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {concerns.length > 0 && (
            <div>
              <div className="text-sm font-medium text-orange-600">Concerns</div>
              <ul className="mt-1 space-y-1">
                {concerns.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="mt-0.5 h-3 w-3 text-orange-500" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4.5 Component Registry

**File:** `apps/web/lib/ui-catalog/registry.tsx`

```typescript
'use client';

import type { ComponentRegistry } from '@json-render/react';
import type { DealScoutCatalog } from './catalog';

// Import all components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Stat } from './components/stat';
import { DealSummary } from './components/deal-summary';
import { MarketSnapshot } from './components/market-snapshot';
import { ParkCard } from './components/park-card';
import { ComparisonTable } from './components/comparison-table';
import { AlertBanner } from './components/alert-banner';
import { BarChart, LineChart, PieChart } from './components/charts';

export const componentRegistry: ComponentRegistry<DealScoutCatalog> = {
  // Layout
  Card: ({ element, children }) => (
    <Card className={element.props.variant === 'danger' ? 'border-red-500' : ''}>
      {element.props.title && (
        <CardHeader>
          <CardTitle>{element.props.title}</CardTitle>
          {element.props.description && (
            <CardDescription>{element.props.description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  ),

  Grid: ({ element, children }) => (
    <div
      className={`grid gap-${element.props.gap === 'sm' ? '2' : element.props.gap === 'lg' ? '6' : '4'}`}
      style={{ gridTemplateColumns: `repeat(${element.props.columns}, 1fr)` }}
    >
      {children}
    </div>
  ),

  // Data Display
  Stat: ({ element }) => <Stat {...element.props} />,
  Table: ({ element }) => (
    <div className="rounded-md border">
      <table className="w-full">
        <thead className="border-b bg-muted/50">
          <tr>
            {element.props.columns.map((col) => (
              <th
                key={col.key}
                className={`p-2 text-left text-sm font-medium ${col.align === 'right' ? 'text-right' : ''}`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {element.props.data.map((row, i) => (
            <tr key={i} className={element.props.striped && i % 2 ? 'bg-muted/25' : ''}>
              {element.props.columns.map((col) => (
                <td
                  key={col.key}
                  className={`p-2 text-sm ${col.align === 'right' ? 'text-right' : ''}`}
                >
                  {formatValue(row[col.key], col.format)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),

  // Charts
  BarChart: ({ element }) => <BarChart {...element.props} />,
  LineChart: ({ element }) => <LineChart {...element.props} />,
  PieChart: ({ element }) => <PieChart {...element.props} />,

  // MH Park Specific
  ParkCard: ({ element, onAction }) => (
    <ParkCard
      {...element.props}
      onClick={() => onAction?.({ type: 'view_park_details', parkId: element.props.parkId })}
    />
  ),
  DealSummary: ({ element }) => <DealSummary {...element.props} />,
  MarketSnapshot: ({ element }) => <MarketSnapshot {...element.props} />,

  // Interactive
  ComparisonTable: ({ element }) => <ComparisonTable {...element.props} />,
  AlertBanner: ({ element, onAction }) => (
    <AlertBanner
      {...element.props}
      onActionClick={element.props.action ? () => onAction?.(element.props.action!) : undefined}
    />
  ),
};

function formatValue(value: unknown, format?: string): string {
  if (value === null || value === undefined) return '-';

  switch (format) {
    case 'currency':
      return `$${Number(value).toLocaleString()}`;
    case 'percent':
      return `${Number(value).toFixed(1)}%`;
    case 'number':
      return Number(value).toLocaleString();
    default:
      return String(value);
  }
}
```

### 4.6 AI Response with UI Components

**File:** `apps/web/app/api/generate-ui/route.ts`

```typescript
import { streamObject } from 'ai';
import { anthropic } from '@/lib/ai/config';
import { dealScoutCatalog } from '@/lib/ui-catalog/catalog';

export async function POST(req: Request) {
  const { prompt, context } = await req.json();

  const result = await streamObject({
    model: anthropic('claude-sonnet-4-20250514'),
    schema: dealScoutCatalog.schema,
    system: `You are a UI generator for Deal Scout, a mobile home park analysis platform.

When asked to visualize data, generate structured UI components from the available catalog.

Available components:
- Card, Grid: Layout containers
- Stat: Single metric with optional change indicator
- Table: Tabular data
- BarChart, LineChart, PieChart: Data visualizations
- ParkCard: Mobile home park summary card
- DealSummary: Complete deal analysis visualization
- MarketSnapshot: Market context summary
- ComparisonTable: Side-by-side comparisons
- AlertBanner: Notifications and warnings

Generate clean, informative visualizations. Use charts for trends, tables for comparisons,
and cards for summaries. Highlight key insights and call out concerns.`,
    prompt,
  });

  return result.toTextStreamResponse();
}
```

### 4.7 Chat Integration

**File:** `apps/web/components/ai/chat-message.tsx` (updated)

```typescript
'use client';

import { JsonRender } from '@json-render/react';
import { componentRegistry } from '@/lib/ui-catalog/registry';
import { dealScoutCatalog } from '@/lib/ui-catalog/catalog';
import ReactMarkdown from 'react-markdown';
import { useRouter } from 'next/navigation';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  ui?: unknown; // JSON-Render UI tree
}

export function ChatMessage({ role, content, ui }: ChatMessageProps) {
  const router = useRouter();

  const handleAction = (action: { type: string; [key: string]: unknown }) => {
    switch (action.type) {
      case 'view_park_details':
        router.push(`/mh-parks/${action.parkId}`);
        break;
      case 'run_analysis':
        router.push(`/mh-parks/${action.parkId}/analyze`);
        break;
      // Handle other actions...
    }
  };

  if (role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Render text content */}
      {content && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}

      {/* Render UI components if present */}
      {ui && (
        <div className="rounded-lg border bg-card p-4">
          <JsonRender
            tree={ui}
            catalog={dealScoutCatalog}
            registry={componentRegistry}
            onAction={handleAction}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Phase 5: Just-In-Time Data Fetching

### 5.1 Overview

Some data should be fetched on-demand rather than pre-synced:

- Specific parcel/address lookups
- Real-time utility coverage checks
- Fresh market data for negotiations

### 5.2 JIT vs Cached Strategy

| Data Type | Strategy | Rationale |
|-----------|----------|-----------|
| HUD FMR | **Cached** (weekly sync) | Updates annually, stable |
| Census | **Cached** (monthly sync) | Updates annually, stable |
| BLS Employment | **Cached** (monthly sync) | Updates monthly |
| CCN Utility Coverage | **Cached** (quarterly sync) | Updates quarterly |
| Address Geocoding | **JIT** | Unlimited addresses |
| Parcel Details (CAD) | **JIT** | Too many parcels to pre-cache |
| Real-time Comp Sales | **JIT** | Requires external API |

### 5.3 JIT Lookup Service

**File:** `apps/web/lib/services/jit-lookup.ts`

```typescript
/**
 * Just-In-Time Data Lookup Service
 *
 * Fetches data on-demand from external APIs when not available in cache.
 */

import { neon } from '@neondatabase/serverless';

export class JITLookupService {
  private sql: ReturnType<typeof neon>;

  constructor() {
    this.sql = neon(process.env.DATABASE_URL!);
  }

  /**
   * Look up HUD FMR for a ZIP, fetching from API if not cached
   */
  async getFMR(zipCode: string): Promise<{
    cached: boolean;
    data: unknown;
  }> {
    // Check cache first
    const cached = await this.sql`
      SELECT * FROM hud_fair_market_rents
      WHERE zip_code = ${zipCode}
      AND fiscal_year = EXTRACT(YEAR FROM CURRENT_DATE)
    `;

    if (cached.length > 0) {
      return { cached: true, data: cached[0] };
    }

    // Fetch from API
    const apiKey = process.env.HUD_API_KEY;
    if (!apiKey) {
      throw new Error('HUD_API_KEY not configured');
    }

    const response = await fetch(
      `https://www.huduser.gov/hudapi/public/fmr/data/${zipCode}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );

    if (!response.ok) {
      throw new Error(`HUD API error: ${response.status}`);
    }

    const apiData = await response.json();
    const fmr = apiData.data?.basicdata;

    if (!fmr) {
      return { cached: false, data: null };
    }

    // Cache the result
    await this.sql`
      INSERT INTO hud_fair_market_rents (
        zip_code, county_name, metro_name, fiscal_year,
        efficiency, one_bedroom, two_bedroom, three_bedroom, four_bedroom,
        area_name, state_code, source_updated_at
      ) VALUES (
        ${fmr.zip_code}, ${fmr.county_name}, ${fmr.metro_name}, ${fmr.year},
        ${fmr.Efficiency}, ${fmr['One-Bedroom']}, ${fmr['Two-Bedroom']},
        ${fmr['Three-Bedroom']}, ${fmr['Four-Bedroom']},
        ${fmr.area_name}, ${fmr.state_id}, NOW()
      )
      ON CONFLICT (zip_code, fiscal_year) DO UPDATE SET
        efficiency = EXCLUDED.efficiency,
        one_bedroom = EXCLUDED.one_bedroom,
        two_bedroom = EXCLUDED.two_bedroom,
        three_bedroom = EXCLUDED.three_bedroom,
        four_bedroom = EXCLUDED.four_bedroom,
        updated_at = NOW()
    `;

    return {
      cached: false,
      data: {
        zipCode: fmr.zip_code,
        countyName: fmr.county_name,
        fiscalYear: fmr.year,
        efficiency: fmr.Efficiency,
        oneBedroom: fmr['One-Bedroom'],
        twoBedroom: fmr['Two-Bedroom'],
        threeBedroom: fmr['Three-Bedroom'],
        fourBedroom: fmr['Four-Bedroom'],
      }
    };
  }

  /**
   * Geocode an address and check utility coverage
   */
  async lookupAddress(address: string): Promise<{
    geocoded: boolean;
    coordinates?: { lat: number; lng: number };
    zipCode?: string;
    utilities?: {
      hasWater: boolean;
      hasSewer: boolean;
      waterProvider?: string;
      sewerProvider?: string;
    };
  }> {
    // Geocode using Mapbox
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!mapboxToken) {
      return { geocoded: false };
    }

    const geoResponse = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?` +
      `access_token=${mapboxToken}&country=US&types=address`
    );

    if (!geoResponse.ok) {
      return { geocoded: false };
    }

    const geoData = await geoResponse.json();
    const feature = geoData.features?.[0];

    if (!feature) {
      return { geocoded: false };
    }

    const [lng, lat] = feature.center;
    const zipContext = feature.context?.find((c: any) => c.id.startsWith('postcode'));

    // Check CCN coverage
    const ccnResults = await this.sql`
      SELECT ccn_number, utility_name, service_type
      FROM ccn_areas
      WHERE ST_Contains(
        boundary::geometry,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      )
    `;

    const water = ccnResults.find(r => r.service_type === 'water' || r.service_type === 'both');
    const sewer = ccnResults.find(r => r.service_type === 'sewer' || r.service_type === 'both');

    return {
      geocoded: true,
      coordinates: { lat, lng },
      zipCode: zipContext?.text,
      utilities: {
        hasWater: !!water,
        hasSewer: !!sewer,
        waterProvider: water?.utility_name,
        sewerProvider: sewer?.utility_name,
      },
    };
  }
}

export const jitLookup = new JITLookupService();
```

---

## Phase 6: Verification & Testing

### 6.1 Go Service Tests

**File:** `services/data-sync/internal/sources/hud/client_test.go`

```go
package hud_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dealforge/data-sync/internal/sources/hud"
)

func TestGetFMRByZIP(t *testing.T) {
	// Mock server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"data": {
				"basicdata": {
					"zip_code": "78201",
					"county_name": "Bexar County",
					"year": 2024,
					"Efficiency": 900,
					"One-Bedroom": 1000,
					"Two-Bedroom": 1200,
					"Three-Bedroom": 1600,
					"Four-Bedroom": 2000
				}
			}
		}`))
	}))
	defer server.Close()

	client := hud.NewClientWithURL("test-key", server.URL)

	resp, err := client.GetFMRByZIP(context.Background(), "78201")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if resp.Data.BasicData.ZipCode != "78201" {
		t.Errorf("expected zip 78201, got %s", resp.Data.BasicData.ZipCode)
	}

	if resp.Data.BasicData.TwoBR != 1200 {
		t.Errorf("expected 2BR rent 1200, got %d", resp.Data.BasicData.TwoBR)
	}
}
```

### 6.2 AI Tool Tests

**File:** `apps/web/lib/ai/tools/__tests__/get-market-context.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getMarketContext } from '../get-market-context';

describe('getMarketContext', () => {
  it('returns FMR data for a valid ZIP', async () => {
    // Mock database
    vi.mock('@neondatabase/serverless', () => ({
      neon: () => vi.fn().mockResolvedValue([
        {
          fiscal_year: 2024,
          two_bedroom: 1200,
          county_name: 'Bexar County',
        }
      ]),
    }));

    const result = await getMarketContext.execute({
      zipCode: '78201'
    }, {});

    expect(result.fairMarketRents).toBeDefined();
    expect(result.fairMarketRents.current.twoBedroom).toBe(1200);
  });

  it('generates market insights', async () => {
    const result = await getMarketContext.execute({
      zipCode: '78201',
      county: 'Bexar',
    }, {});

    expect(result.insights).toBeInstanceOf(Array);
    expect(result.insights.length).toBeGreaterThan(0);
  });
});
```

### 6.3 Integration Test

**File:** `apps/web/app/api/chat/__tests__/integration.test.ts`

```typescript
import { describe, it, expect } from 'vitest';

describe('Chat API Integration', () => {
  it('can answer market context questions', async () => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: 'What is the Fair Market Rent in Bexar County?'
          }
        ],
      }),
    });

    expect(response.ok).toBe(true);

    const reader = response.body?.getReader();
    const chunks: string[] = [];

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(new TextDecoder().decode(value));
    }

    const fullResponse = chunks.join('');
    expect(fullResponse).toContain('Fair Market Rent');
    expect(fullResponse).toMatch(/\$\d+/); // Contains a dollar amount
  });
});
```

---

## Deployment Strategy

### Recommended Approach

| Component | Platform | Notes |
|-----------|----------|-------|
| Next.js App | Vercel | Existing setup works |
| Go Sync Service | GitHub Actions | No infrastructure needed |
| Database | Neon | Existing setup works |

### Environment Variables to Add

```bash
# apps/web/.env.local (add to existing)
HUD_API_KEY=your_hud_api_key
CENSUS_API_KEY=your_census_api_key

# For Go service (GitHub Secrets)
DATABASE_URL=...
HUD_API_KEY=...
CENSUS_API_KEY=...
BLS_API_KEY=...  # Optional
```

### Vercel Configuration

No changes needed. The Go service runs separately via GitHub Actions.

### Database Migrations

```bash
# Generate migration for new market data tables
pnpm db:generate

# Push schema to Neon
pnpm db:push
```

---

## File Summary

### New Files - Go Service

| Action | Path |
|--------|------|
| CREATE | `services/data-sync/internal/config/config.go` |
| CREATE | `services/data-sync/internal/db/postgres.go` |
| CREATE | `services/data-sync/internal/db/market_data.go` |
| CREATE | `services/data-sync/internal/sources/hud/client.go` |
| CREATE | `services/data-sync/internal/sources/hud/types.go` |
| CREATE | `services/data-sync/internal/sources/census/client.go` |
| CREATE | `services/data-sync/internal/sources/census/types.go` |
| CREATE | `services/data-sync/internal/sources/bls/client.go` |
| CREATE | `services/data-sync/internal/sources/bls/types.go` |
| CREATE | `services/data-sync/internal/sync/orchestrator.go` |
| CREATE | `services/data-sync/internal/sync/texas_zips.go` |
| MODIFY | `services/data-sync/cmd/sync/main.go` |

### New Files - Database

| Action | Path |
|--------|------|
| CREATE | `packages/database/src/schema/market-data.ts` |
| MODIFY | `packages/database/src/schema/index.ts` |

### New Files - AI Tools

| Action | Path |
|--------|------|
| CREATE | `apps/web/lib/ai/tools/get-market-context.ts` |
| CREATE | `apps/web/lib/ai/tools/lookup-parcel-data.ts` |
| MODIFY | `apps/web/lib/ai/tools/index.ts` |
| MODIFY | `apps/web/app/api/chat/route.ts` |

### New Files - JSON-Render UI

| Action | Path |
|--------|------|
| CREATE | `apps/web/lib/ui-catalog/catalog.ts` |
| CREATE | `apps/web/lib/ui-catalog/registry.tsx` |
| CREATE | `apps/web/lib/ui-catalog/components/stat.tsx` |
| CREATE | `apps/web/lib/ui-catalog/components/deal-summary.tsx` |
| CREATE | `apps/web/lib/ui-catalog/components/market-snapshot.tsx` |
| CREATE | `apps/web/lib/ui-catalog/components/park-card.tsx` |
| CREATE | `apps/web/lib/ui-catalog/components/comparison-table.tsx` |
| CREATE | `apps/web/lib/ui-catalog/components/alert-banner.tsx` |
| CREATE | `apps/web/lib/ui-catalog/components/charts.tsx` |
| CREATE | `apps/web/app/api/generate-ui/route.ts` |
| MODIFY | `apps/web/components/ai/chat-message.tsx` |

### New Files - Infrastructure

| Action | Path |
|--------|------|
| CREATE | `.github/workflows/data-sync.yml` |
| CREATE | `apps/web/lib/services/jit-lookup.ts` |

---

## Example User Interactions

### Market Context Query

```
User: What's the market like in Bexar County for mobile home parks?

Agent: [calls getMarketContext with county="Bexar"]

**Bexar County Market Overview**

📊 **Fair Market Rents (2024)**
- 2BR FMR: $1,285/mo
- Suggested lot rent: $385-$514/mo (30-40% of FMR)
- YoY change: +4.2%

👥 **Demographics (2022 ACS)**
- Population: 2,009,324
- Median household income: $62,450
- Poverty rate: 13.8%
- Mobile homes: 28,450 units (2.1% of housing)

💼 **Employment (Dec 2024)**
- Unemployment rate: 3.8%
- Labor force: 1,045,000
- Avg weekly wage: $1,125

**Insights:**
- Lot rent around $450/mo is well-supported by local incomes
- Low unemployment suggests stable rent collection
- Strong MH market presence with 28k+ units
```

### Dynamic UI Response

```
User: Show me a comparison of distressed parks in Harris vs Bexar County

Agent: [calls compareParksByCounty, then generates UI]

[Renders ComparisonTable component with side-by-side metrics]
[Renders BarChart showing distress score distribution]
[Renders AlertBanner highlighting: "Harris County has 3x more high-distress opportunities"]
```

---

## Next Steps After Implementation

1. **Expand Market Data**
   - Add USPS vacancy data (monthly)
   - Add CoStar market reports (if API available)
   - Add crime statistics from FBI UCR

2. **Enhanced Visualizations**
   - Map-based market heat maps
   - Historical trend charts
   - Portfolio-level dashboards

3. **Opportunity Alerts**
   - Build on this foundation for proactive notifications
   - "New high-distress park appeared in your target market"

4. **Flood Data (Deprioritized)**
   - Consider adding FEMA data later for AI analysis
   - Current approach (link to FEMA site) is acceptable

---

*Last updated: January 2025*
