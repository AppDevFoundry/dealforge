# Data Population, Seeding & Testing - Implementation Plan

## Overview

This plan covers three interconnected goals:

1. **Populate real data** from actual sources (TDHCA, HUD, Census, BLS)
2. **Create seed data exports** from that real data for easy database resets
3. **Add comprehensive test suites** for Go services and AI tools

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Phase 1: Data Acquisition](#phase-1-data-acquisition)
3. [Phase 2: Data Population](#phase-2-data-population)
4. [Phase 3: Seed Data Export](#phase-3-seed-data-export)
5. [Phase 4: Go Service Tests](#phase-4-go-service-tests)
6. [Phase 5: AI Tool Tests](#phase-5-ai-tool-tests)
7. [Phase 6: Cleanup & Verification](#phase-6-cleanup--verification)
8. [File Summary](#file-summary)

---

## Current State Assessment

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| TDHCA sync scripts | ✅ Ready | `sync:tdhca:titles`, `sync:tdhca:liens` |
| Park discovery | ✅ Ready | `discover:parks` |
| Distress calculation | ✅ Ready | `calc:distress` |
| CCN sync | ✅ Ready | `sync:ccn` (data already loaded) |
| Go market data sync | ✅ Ready | HUD, Census, BLS clients |
| Fake seed data | ⚠️ Exists | `seed-mh-parks.ts` creates random data |
| Real seed data | ❌ Missing | Need to create from actual sources |
| Go tests | ❌ Missing | No unit tests |
| AI tool tests | ❌ Missing | No integration tests |

### Data Sources Required

| Source | Data Type | How to Obtain |
|--------|-----------|---------------|
| **TDHCA** | Title records | Manual download from mhweb.tdhca.state.tx.us |
| **TDHCA** | Tax liens | Manual download from mhweb.tdhca.state.tx.us |
| **HUD** | Fair Market Rents | Go sync service (API) |
| **Census** | Demographics | Go sync service (API) |
| **BLS** | Employment | Go sync service (API) |
| **PUC Texas** | CCN boundaries | Already loaded ✅ |

---

## Phase 1: Data Acquisition

### 1.1 TDHCA Data Download

**Source:** https://mhweb.tdhca.state.tx.us

#### Title Records
1. Navigate to TDHCA MH Division data portal
2. Select "Download Title Info"
3. Filter by county or download all Texas
4. Export as CSV
5. Save to `data/raw/tdhca/` directory

**Expected file:** `TTL[timestamp].csv` (~500MB for all Texas)

#### Tax Lien Records
1. Navigate to "Tax Lien Download"
2. Select date range (recommend last 3 years)
3. Export as CSV
4. Save to `data/raw/tdhca/` directory

**Expected file:** `TAX[timestamp].csv` (~50MB)

### 1.2 Create Data Directory Structure

```bash
mkdir -p data/raw/tdhca
mkdir -p data/raw/market
mkdir -p data/seed
mkdir -p data/exports
```

Add to `.gitignore`:
```
# Raw data (too large for git)
data/raw/

# Keep seed data in git
!data/seed/
```

### 1.3 API Keys Required

Before running market data sync, ensure you have:

```bash
# .env.local or environment
HUD_API_KEY=xxx        # From huduser.gov/hudapi
CENSUS_API_KEY=xxx     # From api.census.gov/data/key_signup.html
BLS_API_KEY=xxx        # Optional, from data.bls.gov (higher rate limits)
DATABASE_URL=xxx       # Neon connection string
```

---

## Phase 2: Data Population

### 2.1 Clear Existing Fake Data

**File:** `packages/database/src/scripts/clear-fake-data.ts`

```typescript
/**
 * Clear Fake Data Script
 *
 * Removes synthetic/random data while preserving real imported data.
 * Run this before populating with real data.
 */

import { neon } from '@neondatabase/serverless';

async function clearFakeData() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log('🧹 Clearing fake data...\n');

  // Clear synthetic MH communities (those without source_file)
  const communitiesResult = await sql`
    DELETE FROM mh_communities
    WHERE metadata->>'source' = 'seed'
    OR metadata->>'source' IS NULL
    RETURNING id
  `;
  console.log(`  Deleted ${communitiesResult.length} synthetic communities`);

  // Clear synthetic titlings (those without source)
  const titlingsResult = await sql`
    DELETE FROM mh_titlings
    WHERE source = 'seed' OR source IS NULL
    RETURNING id
  `;
  console.log(`  Deleted ${titlingsResult.length} synthetic titling records`);

  // Clear synthetic flood zones (those from seed script)
  const floodResult = await sql`
    DELETE FROM flood_zones
    WHERE source_file = 'seed'
    RETURNING id
  `;
  console.log(`  Deleted ${floodResult.length} synthetic flood zones`);

  // Keep: CCN data (already real)
  // Keep: Texas counties reference data
  // Keep: Users and deals (user-generated)

  console.log('\n✅ Fake data cleared. Ready for real data import.');
}

clearFakeData().catch(console.error);
```

Add npm script:
```json
{
  "clear:fake-data": "tsx src/scripts/clear-fake-data.ts"
}
```

### 2.2 Import TDHCA Data

Run in sequence:

```bash
# 1. Import title records (this takes a while for full Texas)
pnpm --filter @dealforge/database sync:tdhca:titles data/raw/tdhca/TTL*.csv

# 2. Import tax lien records
pnpm --filter @dealforge/database sync:tdhca:liens data/raw/tdhca/TAX*.csv

# 3. Discover parks from title clusters
pnpm --filter @dealforge/database discover:parks --min-units=5

# 4. Calculate distress scores
pnpm --filter @dealforge/database calc:distress
```

### 2.3 Import Market Data (Go Service)

```bash
cd services/data-sync

# Dry run first to verify
go run ./cmd/sync --state=TX --sources=all --dry-run

# Actual import
go run ./cmd/sync --state=TX --sources=all

# Or import one at a time
go run ./cmd/sync --state=TX --sources=hud
go run ./cmd/sync --state=TX --sources=census --census-year=2022
go run ./cmd/sync --state=TX --sources=bls --bls-start-year=2021 --bls-end-year=2024
```

### 2.4 Verify Data Population

**File:** `packages/database/src/scripts/verify-data.ts`

```typescript
/**
 * Verify Data Population
 *
 * Checks that all tables have expected data counts.
 */

import { neon } from '@neondatabase/serverless';

async function verifyData() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log('📊 Data Verification Report\n');
  console.log('='.repeat(50));

  // TDHCA Data
  const titles = await sql`SELECT COUNT(*) as count FROM mh_ownership_records`;
  const liens = await sql`SELECT COUNT(*) as count, COUNT(*) FILTER (WHERE status = 'active') as active FROM mh_tax_liens`;
  const parks = await sql`SELECT COUNT(*) as count FROM mh_communities`;
  const distressed = await sql`SELECT COUNT(*) as count FROM mh_communities WHERE distress_score > 0`;

  console.log('\n📋 TDHCA Data:');
  console.log(`  Ownership records: ${titles[0].count.toLocaleString()}`);
  console.log(`  Tax liens: ${liens[0].count.toLocaleString()} (${liens[0].active} active)`);
  console.log(`  MH Communities: ${parks[0].count.toLocaleString()}`);
  console.log(`  With distress scores: ${distressed[0].count.toLocaleString()}`);

  // Market Data
  const hud = await sql`SELECT COUNT(*) as count, COUNT(DISTINCT zip_code) as zips FROM hud_fair_market_rents`;
  const census = await sql`SELECT COUNT(*) as count, COUNT(DISTINCT county_code) as counties FROM census_demographics`;
  const bls = await sql`SELECT COUNT(*) as count, COUNT(DISTINCT area_code) as areas FROM bls_employment`;

  console.log('\n📈 Market Data:');
  console.log(`  HUD FMR: ${hud[0].count.toLocaleString()} records (${hud[0].zips} ZIP codes)`);
  console.log(`  Census: ${census[0].count.toLocaleString()} records (${census[0].counties} counties)`);
  console.log(`  BLS: ${bls[0].count.toLocaleString()} records (${bls[0].areas} areas)`);

  // Infrastructure
  const ccn = await sql`SELECT COUNT(*) as count FROM ccn_areas`;
  const flood = await sql`SELECT COUNT(*) as count FROM flood_zones`;

  console.log('\n🗺️ Infrastructure Data:');
  console.log(`  CCN Areas: ${ccn[0].count.toLocaleString()}`);
  console.log(`  Flood Zones: ${flood[0].count.toLocaleString()}`);

  // Top counties by park count
  const topCounties = await sql`
    SELECT county, COUNT(*) as park_count
    FROM mh_communities
    GROUP BY county
    ORDER BY park_count DESC
    LIMIT 10
  `;

  console.log('\n🏆 Top Counties by Park Count:');
  topCounties.forEach((row, i) => {
    console.log(`  ${i + 1}. ${row.county}: ${row.park_count} parks`);
  });

  console.log('\n' + '='.repeat(50));
  console.log('✅ Verification complete');
}

verifyData().catch(console.error);
```

Add npm script:
```json
{
  "verify:data": "tsx src/scripts/verify-data.ts"
}
```

---

## Phase 3: Seed Data Export

### 3.1 Export Real Data to Seed Files

After populating with real data, export a representative subset for seeding.

**File:** `packages/database/src/scripts/export-seed-data.ts`

```typescript
/**
 * Export Seed Data
 *
 * Exports real data from the database into seed files that can be
 * used to quickly reset development databases.
 *
 * Strategy:
 * - Export ALL reference data (counties, etc.)
 * - Export SAMPLE of large tables (parks, titles, liens)
 * - Focus on MVP counties for manageable size
 */

import { neon } from '@neondatabase/serverless';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SEED_DIR = join(__dirname, '../../data/seed');
const MVP_COUNTIES = ['BEXAR', 'HIDALGO', 'CAMERON', 'NUECES', 'TRAVIS', 'HARRIS', 'DALLAS', 'TARRANT'];

async function exportSeedData() {
  const sql = neon(process.env.DATABASE_URL!);

  mkdirSync(SEED_DIR, { recursive: true });

  console.log('📦 Exporting seed data...\n');

  // 1. Texas Counties (all)
  console.log('Exporting texas_counties...');
  const counties = await sql`SELECT * FROM texas_counties ORDER BY name`;
  writeJsonFile('texas-counties.json', counties);
  console.log(`  ✓ ${counties.length} counties`);

  // 2. MH Communities (MVP counties only, limit 500)
  console.log('Exporting mh_communities...');
  const communities = await sql`
    SELECT * FROM mh_communities
    WHERE UPPER(county) = ANY(${MVP_COUNTIES})
    ORDER BY distress_score DESC NULLS LAST
    LIMIT 500
  `;
  writeJsonFile('mh-communities.json', communities);
  console.log(`  ✓ ${communities.length} communities`);

  // 3. MH Ownership Records (sample from MVP counties)
  console.log('Exporting mh_ownership_records...');
  const ownershipRecords = await sql`
    SELECT * FROM mh_ownership_records
    WHERE UPPER(install_county) = ANY(${MVP_COUNTIES})
    LIMIT 5000
  `;
  writeJsonFile('mh-ownership-records.json', ownershipRecords);
  console.log(`  ✓ ${ownershipRecords.length} ownership records`);

  // 4. MH Tax Liens (active liens from MVP counties)
  console.log('Exporting mh_tax_liens...');
  const liens = await sql`
    SELECT * FROM mh_tax_liens
    WHERE UPPER(county) = ANY(${MVP_COUNTIES})
    AND status = 'active'
    LIMIT 2000
  `;
  writeJsonFile('mh-tax-liens.json', liens);
  console.log(`  ✓ ${liens.length} tax liens`);

  // 5. HUD Fair Market Rents (Texas only, latest year)
  console.log('Exporting hud_fair_market_rents...');
  const hudData = await sql`
    SELECT DISTINCT ON (zip_code) *
    FROM hud_fair_market_rents
    WHERE state_code = 'TX' OR state_code = '48'
    ORDER BY zip_code, fiscal_year DESC
  `;
  writeJsonFile('hud-fair-market-rents.json', hudData);
  console.log(`  ✓ ${hudData.length} FMR records`);

  // 6. Census Demographics (Texas counties)
  console.log('Exporting census_demographics...');
  const censusData = await sql`
    SELECT DISTINCT ON (geo_id) *
    FROM census_demographics
    WHERE state_code = 'TX' OR state_code = '48'
    ORDER BY geo_id, survey_year DESC
  `;
  writeJsonFile('census-demographics.json', censusData);
  console.log(`  ✓ ${censusData.length} census records`);

  // 7. BLS Employment (Texas counties, recent years)
  console.log('Exporting bls_employment...');
  const blsData = await sql`
    SELECT * FROM bls_employment
    WHERE (state_code = 'TX' OR state_code = '48')
    AND year >= 2022
    ORDER BY area_code, year DESC, month DESC NULLS LAST
  `;
  writeJsonFile('bls-employment.json', blsData);
  console.log(`  ✓ ${blsData.length} BLS records`);

  // 8. CCN Areas (MVP counties)
  console.log('Exporting ccn_areas...');
  const ccnAreas = await sql`
    SELECT
      id, ccn_number, utility_name, service_type, county,
      ST_AsGeoJSON(boundary) as boundary_geojson,
      source_updated_at, created_at
    FROM ccn_areas
    WHERE UPPER(county) = ANY(${MVP_COUNTIES})
  `;
  writeJsonFile('ccn-areas.json', ccnAreas);
  console.log(`  ✓ ${ccnAreas.length} CCN areas`);

  // 9. MH Titlings (all - it's aggregated monthly data)
  console.log('Exporting mh_titlings...');
  const titlings = await sql`
    SELECT * FROM mh_titlings
    ORDER BY county, month
  `;
  writeJsonFile('mh-titlings.json', titlings);
  console.log(`  ✓ ${titlings.length} titling records`);

  console.log('\n✅ Seed data exported to:', SEED_DIR);
  console.log('\nFiles created:');
  console.log('  - texas-counties.json');
  console.log('  - mh-communities.json');
  console.log('  - mh-ownership-records.json');
  console.log('  - mh-tax-liens.json');
  console.log('  - hud-fair-market-rents.json');
  console.log('  - census-demographics.json');
  console.log('  - bls-employment.json');
  console.log('  - ccn-areas.json');
  console.log('  - mh-titlings.json');
}

function writeJsonFile(filename: string, data: unknown[]) {
  const filepath = join(SEED_DIR, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2));
}

exportSeedData().catch(console.error);
```

Add npm script:
```json
{
  "export:seed": "tsx src/scripts/export-seed-data.ts"
}
```

### 3.2 Import Seed Data Script

**File:** `packages/database/src/scripts/import-seed-data.ts`

```typescript
/**
 * Import Seed Data
 *
 * Imports seed data from JSON files into the database.
 * Use this to quickly reset a development database with real data.
 *
 * Usage:
 *   pnpm db:seed:real           # Import all seed data
 *   pnpm db:seed:real --force   # Clear existing data first
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SEED_DIR = join(__dirname, '../../data/seed');

interface SeedConfig {
  file: string;
  table: string;
  hasGeometry?: boolean;
  geometryColumn?: string;
}

const SEED_FILES: SeedConfig[] = [
  { file: 'texas-counties.json', table: 'texas_counties' },
  { file: 'mh-communities.json', table: 'mh_communities' },
  { file: 'mh-ownership-records.json', table: 'mh_ownership_records' },
  { file: 'mh-tax-liens.json', table: 'mh_tax_liens' },
  { file: 'hud-fair-market-rents.json', table: 'hud_fair_market_rents' },
  { file: 'census-demographics.json', table: 'census_demographics' },
  { file: 'bls-employment.json', table: 'bls_employment' },
  { file: 'ccn-areas.json', table: 'ccn_areas', hasGeometry: true, geometryColumn: 'boundary' },
  { file: 'mh-titlings.json', table: 'mh_titlings' },
];

async function importSeedData() {
  const sql = neon(process.env.DATABASE_URL!);
  const forceFlag = process.argv.includes('--force');

  console.log('🌱 Importing seed data...\n');

  if (forceFlag) {
    console.log('⚠️  --force flag detected, clearing existing data...\n');
    // Clear in reverse order to respect foreign keys
    for (const config of [...SEED_FILES].reverse()) {
      await sql`DELETE FROM ${sql(config.table)}`;
      console.log(`  Cleared ${config.table}`);
    }
    console.log('');
  }

  for (const config of SEED_FILES) {
    const filepath = join(SEED_DIR, config.file);

    if (!existsSync(filepath)) {
      console.log(`⏭️  Skipping ${config.file} (not found)`);
      continue;
    }

    console.log(`Importing ${config.file}...`);

    const data = JSON.parse(readFileSync(filepath, 'utf-8'));

    if (data.length === 0) {
      console.log(`  ⏭️  Empty file, skipping`);
      continue;
    }

    // Handle geometry columns specially
    if (config.hasGeometry && config.geometryColumn) {
      await importWithGeometry(sql, config.table, data, config.geometryColumn);
    } else {
      await importBatch(sql, config.table, data);
    }

    console.log(`  ✓ ${data.length} records`);
  }

  console.log('\n✅ Seed data import complete');
}

async function importBatch(sql: ReturnType<typeof neon>, table: string, data: any[]) {
  // Import in batches of 100
  const BATCH_SIZE = 100;

  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    const columns = Object.keys(batch[0]);

    // Build INSERT statement
    const values = batch.map(row =>
      `(${columns.map(col => formatValue(row[col])).join(', ')})`
    ).join(',\n');

    await sql.unsafe(`
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES ${values}
      ON CONFLICT DO NOTHING
    `);
  }
}

async function importWithGeometry(
  sql: ReturnType<typeof neon>,
  table: string,
  data: any[],
  geometryColumn: string
) {
  for (const row of data) {
    const geojson = row[`${geometryColumn}_geojson`];
    const otherColumns = Object.keys(row).filter(k => k !== `${geometryColumn}_geojson`);

    const columnList = [...otherColumns, geometryColumn].join(', ');
    const valueList = [
      ...otherColumns.map(col => formatValue(row[col])),
      geojson ? `ST_GeomFromGeoJSON('${geojson}')::geography` : 'NULL'
    ].join(', ');

    await sql.unsafe(`
      INSERT INTO ${table} (${columnList})
      VALUES (${valueList})
      ON CONFLICT DO NOTHING
    `);
  }
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

importSeedData().catch(console.error);
```

Add npm scripts:
```json
{
  "db:seed:real": "tsx src/scripts/import-seed-data.ts",
  "db:seed:real:force": "tsx src/scripts/import-seed-data.ts --force"
}
```

### 3.3 Update package.json Scripts

**File:** `packages/database/package.json` (add to scripts)

```json
{
  "scripts": {
    "clear:fake-data": "tsx src/scripts/clear-fake-data.ts",
    "verify:data": "tsx src/scripts/verify-data.ts",
    "export:seed": "tsx src/scripts/export-seed-data.ts",
    "db:seed:real": "tsx src/scripts/import-seed-data.ts",
    "db:seed:real:force": "tsx src/scripts/import-seed-data.ts --force"
  }
}
```

---

## Phase 4: Go Service Tests

### 4.1 Test Structure

```
services/data-sync/
├── internal/
│   ├── sources/
│   │   ├── hud/
│   │   │   ├── client.go
│   │   │   ├── client_test.go      # NEW
│   │   │   └── types.go
│   │   ├── census/
│   │   │   ├── client.go
│   │   │   ├── client_test.go      # NEW
│   │   │   └── types.go
│   │   └── bls/
│   │       ├── client.go
│   │       ├── client_test.go      # NEW
│   │       └── types.go
│   ├── db/
│   │   ├── market_data.go
│   │   └── market_data_test.go     # NEW
│   └── sync/
│       ├── orchestrator.go
│       └── orchestrator_test.go    # NEW
└── testdata/                       # NEW - test fixtures
    ├── hud_response.json
    ├── census_response.json
    └── bls_response.json
```

### 4.2 HUD Client Tests

**File:** `services/data-sync/internal/sources/hud/client_test.go`

```go
package hud_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dealforge/data-sync/internal/sources/hud"
)

func TestClient_GetFMRByZIP(t *testing.T) {
	tests := []struct {
		name           string
		zipCode        string
		mockResponse   string
		mockStatusCode int
		wantErr        bool
		wantZip        string
		wantTwoBR      int
	}{
		{
			name:    "valid ZIP returns FMR data",
			zipCode: "78201",
			mockResponse: `{
				"data": {
					"basicdata": {
						"zip_code": "78201",
						"county_name": "Bexar County",
						"metro_name": "San Antonio-New Braunfels, TX",
						"year": 2024,
						"Efficiency": 904,
						"One-Bedroom": 1031,
						"Two-Bedroom": 1285,
						"Three-Bedroom": 1748,
						"Four-Bedroom": 2143
					}
				}
			}`,
			mockStatusCode: http.StatusOK,
			wantErr:        false,
			wantZip:        "78201",
			wantTwoBR:      1285,
		},
		{
			name:           "invalid ZIP returns error",
			zipCode:        "00000",
			mockResponse:   `{"error": "ZIP code not found"}`,
			mockStatusCode: http.StatusNotFound,
			wantErr:        true,
		},
		{
			name:           "API error returns error",
			zipCode:        "78201",
			mockResponse:   ``,
			mockStatusCode: http.StatusInternalServerError,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// Verify auth header
				if r.Header.Get("Authorization") == "" {
					t.Error("expected Authorization header")
				}

				w.WriteHeader(tt.mockStatusCode)
				w.Write([]byte(tt.mockResponse))
			}))
			defer server.Close()

			client := hud.NewClientWithBaseURL("test-api-key", server.URL)
			resp, err := client.GetFMRByZIP(context.Background(), tt.zipCode)

			if (err != nil) != tt.wantErr {
				t.Errorf("GetFMRByZIP() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if resp.Data.BasicData.ZipCode != tt.wantZip {
					t.Errorf("ZipCode = %v, want %v", resp.Data.BasicData.ZipCode, tt.wantZip)
				}
				if resp.Data.BasicData.TwoBR != tt.wantTwoBR {
					t.Errorf("TwoBR = %v, want %v", resp.Data.BasicData.TwoBR, tt.wantTwoBR)
				}
			}
		})
	}
}

func TestClient_GetFMRByZIP_Timeout(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Don't respond - let it timeout
		select {}
	}))
	defer server.Close()

	client := hud.NewClientWithBaseURL("test-api-key", server.URL)

	ctx, cancel := context.WithTimeout(context.Background(), 1)
	defer cancel()

	_, err := client.GetFMRByZIP(ctx, "78201")
	if err == nil {
		t.Error("expected timeout error")
	}
}
```

### 4.3 Census Client Tests

**File:** `services/data-sync/internal/sources/census/client_test.go`

```go
package census_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dealforge/data-sync/internal/sources/census"
)

func TestClient_GetCountyDemographics(t *testing.T) {
	tests := []struct {
		name           string
		countyFIPS     string
		year           int
		mockResponse   string
		mockStatusCode int
		wantErr        bool
		wantPopulation string
	}{
		{
			name:       "valid county returns demographics",
			countyFIPS: "029", // Bexar
			year:       2022,
			// Census API returns array of arrays: [headers, data]
			mockResponse: `[
				["B01003_001E","B19013_001E","state","county"],
				["2009324","62450","48","029"]
			]`,
			mockStatusCode: http.StatusOK,
			wantErr:        false,
			wantPopulation: "2009324",
		},
		{
			name:           "invalid county returns error",
			countyFIPS:     "999",
			year:           2022,
			mockResponse:   `{"error": "Invalid FIPS code"}`,
			mockStatusCode: http.StatusBadRequest,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				// Verify API key in query params
				if r.URL.Query().Get("key") == "" {
					t.Error("expected API key in query params")
				}

				w.WriteHeader(tt.mockStatusCode)
				w.Write([]byte(tt.mockResponse))
			}))
			defer server.Close()

			client := census.NewClientWithBaseURL("test-api-key", server.URL)
			data, err := client.GetCountyDemographics(context.Background(), tt.countyFIPS, tt.year)

			if (err != nil) != tt.wantErr {
				t.Errorf("GetCountyDemographics() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				if pop, ok := data["B01003_001E"].(string); !ok || pop != tt.wantPopulation {
					t.Errorf("Population = %v, want %v", data["B01003_001E"], tt.wantPopulation)
				}
			}
		})
	}
}
```

### 4.4 BLS Client Tests

**File:** `services/data-sync/internal/sources/bls/client_test.go`

```go
package bls_test

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/dealforge/data-sync/internal/sources/bls"
)

func TestClient_GetCountyEmployment(t *testing.T) {
	mockResponse := `{
		"status": "REQUEST_SUCCEEDED",
		"Results": {
			"series": [{
				"seriesID": "LAUCN480290000000003",
				"data": [{
					"year": "2024",
					"period": "M11",
					"value": "3.8",
					"footnotes": [{}]
				}]
			}]
		}
	}`

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(mockResponse))
	}))
	defer server.Close()

	client := bls.NewClientWithBaseURL("test-api-key", server.URL)
	data, err := client.GetCountyEmployment(context.Background(), "48029")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if data == nil {
		t.Fatal("expected data, got nil")
	}
}
```

### 4.5 Orchestrator Tests

**File:** `services/data-sync/internal/sync/orchestrator_test.go`

```go
package sync_test

import (
	"context"
	"testing"

	"github.com/dealforge/data-sync/internal/config"
	"github.com/dealforge/data-sync/internal/sync"
)

func TestOrchestrator_SyncAll_DryRun(t *testing.T) {
	cfg := &config.Config{
		HUDAPIKey:    "test-key",
		CensusAPIKey: "test-key",
		BLSAPIKey:    "test-key",
		DryRun:       true, // Don't actually write to DB
	}

	orch, err := sync.NewOrchestrator(cfg)
	if err != nil {
		t.Fatalf("failed to create orchestrator: %v", err)
	}

	// Small test set
	zips := []string{"78201", "78202"}
	counties := []string{"029"} // Bexar

	results, err := orch.SyncAll(context.Background(), zips, counties)
	if err != nil {
		t.Fatalf("SyncAll failed: %v", err)
	}

	if len(results) != 3 {
		t.Errorf("expected 3 results (HUD, Census, BLS), got %d", len(results))
	}

	for _, result := range results {
		if result.Source == "" {
			t.Error("result missing source name")
		}
		// In dry run, no records should be synced
		if !cfg.DryRun && result.RecordsSynced == 0 && len(result.Errors) == 0 {
			t.Errorf("%s: expected some records or errors", result.Source)
		}
	}
}
```

### 4.6 Run Tests

```bash
cd services/data-sync

# Run all tests
go test -v ./...

# Run with coverage
go test -v -cover ./...

# Run specific package
go test -v ./internal/sources/hud/...

# Run with race detection
go test -race ./...
```

---

## Phase 5: AI Tool Tests

### 5.1 Test Structure

```
apps/web/
├── lib/
│   └── ai/
│       └── tools/
│           ├── __tests__/           # NEW
│           │   ├── setup.ts
│           │   ├── get-market-context.test.ts
│           │   ├── lookup-parcel-data.test.ts
│           │   ├── search-distressed-parks.test.ts
│           │   └── analyze-deal.test.ts
│           ├── get-market-context.ts
│           └── ...
```

### 5.2 Test Setup

**File:** `apps/web/lib/ai/tools/__tests__/setup.ts`

```typescript
/**
 * Test Setup for AI Tools
 *
 * Provides mock database and utilities for testing AI tools.
 */

import { vi } from 'vitest';

// Mock Neon serverless client
export const mockSql = vi.fn();

vi.mock('@neondatabase/serverless', () => ({
  neon: () => mockSql,
}));

// Helper to set mock responses
export function setMockResponse(response: unknown[]) {
  mockSql.mockResolvedValueOnce(response);
}

// Helper to reset mocks between tests
export function resetMocks() {
  mockSql.mockReset();
}

// Sample test data
export const samplePark = {
  id: 'park_123',
  name: 'Sunset Mobile Home Park',
  address: '1234 Sunset Blvd',
  city: 'San Antonio',
  county: 'BEXAR',
  state: 'TX',
  zip_code: '78201',
  lot_count: 72,
  distress_score: 67,
};

export const sampleLien = {
  id: 'lien_123',
  tax_roll_number: 'TRN123',
  payer_name: 'John Doe',
  county: 'BEXAR',
  tax_year: 2024,
  tax_amount: 1500.00,
  status: 'active',
  lien_date: '2024-06-15',
};

export const sampleFMR = {
  zip_code: '78201',
  county_name: 'Bexar County',
  fiscal_year: 2024,
  efficiency: 904,
  one_bedroom: 1031,
  two_bedroom: 1285,
  three_bedroom: 1748,
  four_bedroom: 2143,
};

export const sampleCensus = {
  geo_id: '48029',
  geo_name: 'Bexar County',
  total_population: 2009324,
  median_household_income: 62450,
  poverty_rate: 13.8,
  mobile_homes_count: 28450,
  mobile_homes_percent: 2.1,
  survey_year: 2022,
};

export const sampleBLS = {
  area_code: '48029',
  area_name: 'Bexar County, TX',
  year: 2024,
  month: 11,
  labor_force: 1045000,
  employed: 1005000,
  unemployed: 40000,
  unemployment_rate: 3.8,
};
```

### 5.3 Market Context Tool Tests

**File:** `apps/web/lib/ai/tools/__tests__/get-market-context.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { getMarketContext } from '../get-market-context';
import {
  mockSql,
  resetMocks,
  setMockResponse,
  sampleFMR,
  sampleCensus,
  sampleBLS,
} from './setup';

describe('getMarketContext', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('returns FMR data for a valid ZIP code', async () => {
    setMockResponse([sampleFMR]); // HUD query
    setMockResponse([sampleCensus]); // Census query
    setMockResponse([sampleBLS]); // BLS query

    const result = await getMarketContext.execute({
      zipCode: '78201',
    });

    expect(result.fairMarketRents).toBeDefined();
    expect(result.fairMarketRents.current.twoBedroom).toBe(1285);
    expect(result.location.zipCode).toBe('78201');
  });

  it('returns demographics for a valid county', async () => {
    setMockResponse([]); // No FMR for county-only query
    setMockResponse([sampleCensus]);
    setMockResponse([sampleBLS]);

    const result = await getMarketContext.execute({
      county: 'Bexar',
    });

    expect(result.demographics).toBeDefined();
    expect(result.demographics.population.total).toBe(2009324);
    expect(result.demographics.income.medianHousehold).toBe(62450);
  });

  it('generates market insights', async () => {
    setMockResponse([sampleFMR]);
    setMockResponse([sampleCensus]);
    setMockResponse([sampleBLS]);

    const result = await getMarketContext.execute({
      zipCode: '78201',
      county: 'Bexar',
    });

    expect(result.insights).toBeInstanceOf(Array);
    expect(result.insights.length).toBeGreaterThan(0);
    expect(result.insights.some(i => i.includes('Fair Market Rent'))).toBe(true);
  });

  it('handles missing data gracefully', async () => {
    setMockResponse([]); // No FMR
    setMockResponse([]); // No Census
    setMockResponse([]); // No BLS

    const result = await getMarketContext.execute({
      zipCode: '00000',
    });

    expect(result.fairMarketRents).toBeUndefined();
    expect(result.demographics).toBeUndefined();
    expect(result.employment).toBeUndefined();
  });

  it('returns error when no location provided', async () => {
    const result = await getMarketContext.execute({});

    expect(result.error).toBeDefined();
    expect(result.error).toContain('required');
  });

  it('includes historical data when requested', async () => {
    setMockResponse([
      { ...sampleFMR, fiscal_year: 2024 },
      { ...sampleFMR, fiscal_year: 2023, two_bedroom: 1200 },
    ]);
    setMockResponse([sampleCensus]);
    setMockResponse([sampleBLS, { ...sampleBLS, month: 10 }]);

    const result = await getMarketContext.execute({
      zipCode: '78201',
      includeHistorical: true,
    });

    expect(result.fairMarketRents.historical).toBeDefined();
    expect(result.fairMarketRents.yoyChange).toBeDefined();
  });
});
```

### 5.4 Lookup Parcel Data Tests

**File:** `apps/web/lib/ai/tools/__tests__/lookup-parcel-data.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { lookupParcelData } from '../lookup-parcel-data';
import { mockSql, resetMocks, setMockResponse, sampleFMR, samplePark } from './setup';

// Mock fetch for geocoding
global.fetch = vi.fn();

describe('lookupParcelData', () => {
  beforeEach(() => {
    resetMocks();
    vi.mocked(fetch).mockReset();
  });

  it('geocodes address and checks CCN coverage', async () => {
    // Mock Mapbox geocoding response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [{
          center: [-98.4936, 29.4241], // San Antonio coords
          context: [{ id: 'postcode.123', text: '78201' }],
        }],
      }),
    } as Response);

    // Mock CCN query
    setMockResponse([
      { ccn_number: 'CCN123', utility_name: 'SAWS', service_type: 'water' },
      { ccn_number: 'CCN456', utility_name: 'SAWS', service_type: 'sewer' },
    ]);

    // Mock FMR query
    setMockResponse([sampleFMR]);

    // Mock nearby parks query
    setMockResponse([samplePark]);

    const result = await lookupParcelData.execute({
      address: '1234 Main St, San Antonio, TX',
    });

    expect(result.geocoded).toBe(true);
    expect(result.coordinates).toBeDefined();
    expect(result.utilities.hasWater).toBe(true);
    expect(result.utilities.hasSewer).toBe(true);
    expect(result.nearbyParks).toHaveLength(1);
  });

  it('handles address without utility coverage', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [{
          center: [-98.5, 29.5],
          context: [{ id: 'postcode.123', text: '78250' }],
        }],
      }),
    } as Response);

    // No CCN coverage
    setMockResponse([]);
    setMockResponse([sampleFMR]);
    setMockResponse([]);

    const result = await lookupParcelData.execute({
      address: '9999 Rural Rd, San Antonio, TX',
    });

    expect(result.utilities.hasWater).toBe(false);
    expect(result.utilities.hasSewer).toBe(false);
    expect(result.utilities.warning).toContain('private well/septic');
  });

  it('works with coordinates instead of address', async () => {
    setMockResponse([
      { ccn_number: 'CCN123', utility_name: 'SAWS', service_type: 'both' },
    ]);
    setMockResponse([sampleFMR]);
    setMockResponse([samplePark]);

    const result = await lookupParcelData.execute({
      latitude: 29.4241,
      longitude: -98.4936,
      zipCode: '78201',
    });

    expect(result.geocoded).toBe(true);
    expect(result.coordinates.lat).toBe(29.4241);
    expect(result.utilities.hasWater).toBe(true);
  });

  it('handles geocoding failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await lookupParcelData.execute({
      address: 'Invalid Address',
    });

    expect(result.geocoded).toBe(false);
  });
});
```

### 5.5 Search Distressed Parks Tests

**File:** `apps/web/lib/ai/tools/__tests__/search-distressed-parks.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { searchDistressedParks } from '../search-distressed-parks';
import { mockSql, resetMocks, setMockResponse, samplePark } from './setup';

describe('searchDistressedParks', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('returns parks filtered by county', async () => {
    setMockResponse([samplePark]);
    setMockResponse([{ count: 1 }]); // Total count query

    const result = await searchDistressedParks.execute({
      county: 'BEXAR',
      limit: 10,
    });

    expect(result.parks).toHaveLength(1);
    expect(result.parks[0].county).toBe('BEXAR');
  });

  it('filters by distress score range', async () => {
    setMockResponse([
      { ...samplePark, distress_score: 75 },
      { ...samplePark, id: 'park_456', distress_score: 55 },
    ]);
    setMockResponse([{ count: 2 }]);

    const result = await searchDistressedParks.execute({
      minScore: 50,
      maxScore: 80,
    });

    expect(result.parks).toHaveLength(2);
    result.parks.forEach(park => {
      expect(park.distressScore).toBeGreaterThanOrEqual(50);
      expect(park.distressScore).toBeLessThanOrEqual(80);
    });
  });

  it('filters by lot count', async () => {
    setMockResponse([{ ...samplePark, lot_count: 100 }]);
    setMockResponse([{ count: 1 }]);

    const result = await searchDistressedParks.execute({
      minLots: 50,
      maxLots: 150,
    });

    expect(result.parks).toHaveLength(1);
    expect(result.parks[0].lotCount).toBeGreaterThanOrEqual(50);
  });

  it('respects limit parameter', async () => {
    const parks = Array(20).fill(null).map((_, i) => ({
      ...samplePark,
      id: `park_${i}`,
    }));
    setMockResponse(parks.slice(0, 5));
    setMockResponse([{ count: 20 }]);

    const result = await searchDistressedParks.execute({
      limit: 5,
    });

    expect(result.parks).toHaveLength(5);
    expect(result.totalCount).toBe(20);
  });

  it('returns empty array when no matches', async () => {
    setMockResponse([]);
    setMockResponse([{ count: 0 }]);

    const result = await searchDistressedParks.execute({
      county: 'NONEXISTENT',
    });

    expect(result.parks).toHaveLength(0);
    expect(result.totalCount).toBe(0);
  });
});
```

### 5.6 Vitest Configuration

**File:** `apps/web/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['lib/ai/tools/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

### 5.7 Run Tests

```bash
cd apps/web

# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific file
pnpm test lib/ai/tools/__tests__/get-market-context.test.ts

# Watch mode
pnpm test --watch
```

---

## Phase 6: Cleanup & Verification

### 6.1 Full Data Pipeline Test

After implementing everything, run the full pipeline:

```bash
# 1. Clear fake data
pnpm --filter @dealforge/database clear:fake-data

# 2. Import TDHCA data (ensure you have downloaded the CSVs)
pnpm --filter @dealforge/database sync:tdhca:titles data/raw/tdhca/titles.csv
pnpm --filter @dealforge/database sync:tdhca:liens data/raw/tdhca/liens.csv

# 3. Discover parks and calculate scores
pnpm --filter @dealforge/database discover:parks
pnpm --filter @dealforge/database calc:distress

# 4. Run market data sync
cd services/data-sync
go run ./cmd/sync --state=TX --sources=all

# 5. Verify data
cd ../..
pnpm --filter @dealforge/database verify:data

# 6. Export seed data
pnpm --filter @dealforge/database export:seed

# 7. Run all tests
cd services/data-sync && go test -v ./...
cd ../apps/web && pnpm test
```

### 6.2 Test Seed Import

Test that seed data can be re-imported:

```bash
# Create a Neon branch for testing
# (Or use a local Postgres instance)

# Import seed data to fresh database
pnpm --filter @dealforge/database db:seed:real --force

# Verify counts match expected
pnpm --filter @dealforge/database verify:data
```

### 6.3 CI Integration

Update CI workflow to run tests:

**File:** `.github/workflows/ci.yml` (add to existing)

```yaml
jobs:
  test-go:
    name: Go Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: '1.22'

      - name: Run tests
        working-directory: services/data-sync
        run: go test -v -race -coverprofile=coverage.out ./...

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: services/data-sync/coverage.out
          flags: go

  test-ai-tools:
    name: AI Tool Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        working-directory: apps/web
        run: pnpm test --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: apps/web/coverage/coverage-final.json
          flags: typescript
```

---

## File Summary

### New Scripts (packages/database)

| Action | Path |
|--------|------|
| CREATE | `src/scripts/clear-fake-data.ts` |
| CREATE | `src/scripts/verify-data.ts` |
| CREATE | `src/scripts/export-seed-data.ts` |
| CREATE | `src/scripts/import-seed-data.ts` |
| MODIFY | `package.json` (add scripts) |

### New Tests (Go)

| Action | Path |
|--------|------|
| CREATE | `services/data-sync/internal/sources/hud/client_test.go` |
| CREATE | `services/data-sync/internal/sources/census/client_test.go` |
| CREATE | `services/data-sync/internal/sources/bls/client_test.go` |
| CREATE | `services/data-sync/internal/sync/orchestrator_test.go` |

### New Tests (TypeScript)

| Action | Path |
|--------|------|
| CREATE | `apps/web/lib/ai/tools/__tests__/setup.ts` |
| CREATE | `apps/web/lib/ai/tools/__tests__/get-market-context.test.ts` |
| CREATE | `apps/web/lib/ai/tools/__tests__/lookup-parcel-data.test.ts` |
| CREATE | `apps/web/lib/ai/tools/__tests__/search-distressed-parks.test.ts` |
| CREATE | `apps/web/lib/ai/tools/__tests__/analyze-deal.test.ts` |
| CREATE | `apps/web/vitest.config.ts` |

### Data Directories

| Action | Path |
|--------|------|
| CREATE | `data/raw/tdhca/` (gitignored) |
| CREATE | `data/raw/market/` (gitignored) |
| CREATE | `data/seed/` (committed) |
| MODIFY | `.gitignore` |

### CI Updates

| Action | Path |
|--------|------|
| MODIFY | `.github/workflows/ci.yml` |

---

## Execution Order

1. **Phase 1:** Download TDHCA data manually, set up API keys
2. **Phase 2:** Clear fake data, import real data, run discovery & distress calculation, run Go sync
3. **Phase 3:** Export seed data to JSON files
4. **Phase 4:** Implement Go tests
5. **Phase 5:** Implement AI tool tests
6. **Phase 6:** Verify full pipeline, update CI

---

## Notes

- TDHCA data must be downloaded manually (no API available)
- Market data (HUD, Census, BLS) comes from Go service APIs
- CCN data is already loaded and should be preserved
- Seed files go in `data/seed/` which IS committed to git
- Raw data goes in `data/raw/` which is gitignored (too large)
- Tests use mocks, not real database connections

---

*Last updated: January 2025*
