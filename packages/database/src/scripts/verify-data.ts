/**
 * Data Verification Script
 *
 * Generates a comprehensive data verification report showing:
 * - Record counts per table
 * - Data freshness (last update timestamps)
 * - Coverage statistics (counties, years, etc.)
 * - Data quality checks
 *
 * Usage:
 *   pnpm --filter @dealforge/database verify:data
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment
config({ path: '../../.env.local' });

interface TableStats {
  name: string;
  count: number;
  lastUpdated?: string;
  notes?: string;
}

async function verifyData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('DealForge Data Verification Report');
  console.log('===================================');
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log('');

  // === TDHCA Data ===
  console.log('## TDHCA Data');
  console.log('');

  const ownershipCount = await sql`SELECT COUNT(*) as count FROM mh_ownership_records`;
  const ownershipCounties = await sql`
    SELECT COUNT(DISTINCT install_county) as count FROM mh_ownership_records
  `;
  const ownershipLatest = await sql`
    SELECT MAX(created_at) as latest FROM mh_ownership_records
  `;
  console.log(`mh_ownership_records:`);
  console.log(`  Total records: ${ownershipCount[0]?.count || 0}`);
  console.log(`  Unique counties: ${ownershipCounties[0]?.count || 0}`);
  console.log(`  Last import: ${ownershipLatest[0]?.latest || 'never'}`);

  const liensCount = await sql`SELECT COUNT(*) as count FROM mh_tax_liens`;
  const liensActive = await sql`
    SELECT COUNT(*) as count FROM mh_tax_liens WHERE status = 'active'
  `;
  const liensYears = await sql`
    SELECT MIN(tax_year) as min_year, MAX(tax_year) as max_year FROM mh_tax_liens
  `;
  console.log(`\nmh_tax_liens:`);
  console.log(`  Total records: ${liensCount[0]?.count || 0}`);
  console.log(`  Active liens: ${liensActive[0]?.count || 0}`);
  console.log(`  Tax years: ${liensYears[0]?.min_year || 'N/A'} - ${liensYears[0]?.max_year || 'N/A'}`);

  // === MH Communities ===
  console.log('\n## MH Communities');
  console.log('');

  const mhCommCount = await sql`SELECT COUNT(*) as count FROM mh_communities`;
  const mhCommBySource = await sql`
    SELECT source, COUNT(*) as count
    FROM mh_communities
    GROUP BY source
    ORDER BY count DESC
  `;
  const mhCommWithDistress = await sql`
    SELECT COUNT(*) as count FROM mh_communities WHERE distress_score IS NOT NULL
  `;
  const avgDistress = await sql`
    SELECT AVG(distress_score) as avg, MIN(distress_score) as min, MAX(distress_score) as max
    FROM mh_communities WHERE distress_score IS NOT NULL
  `;
  console.log(`mh_communities:`);
  console.log(`  Total: ${mhCommCount[0]?.count || 0}`);
  console.log(`  By source:`);
  for (const row of mhCommBySource) {
    console.log(`    ${row.source}: ${row.count}`);
  }
  console.log(`  With distress score: ${mhCommWithDistress[0]?.count || 0}`);
  if (avgDistress[0]?.avg) {
    console.log(`  Distress score range: ${Number(avgDistress[0]?.min).toFixed(1)} - ${Number(avgDistress[0]?.max).toFixed(1)} (avg: ${Number(avgDistress[0]?.avg).toFixed(1)})`);
  }

  // === Market Data ===
  console.log('\n## Market Data (HUD, Census, BLS)');
  console.log('');

  // HUD FMR
  const fmrCount = await sql`SELECT COUNT(*) as count FROM hud_fair_market_rents`;
  const fmrYears = await sql`
    SELECT DISTINCT fiscal_year FROM hud_fair_market_rents ORDER BY fiscal_year DESC LIMIT 5
  `;
  const fmrCounties = await sql`
    SELECT COUNT(DISTINCT county_name) as count FROM hud_fair_market_rents WHERE county_name IS NOT NULL
  `;
  console.log(`hud_fair_market_rents:`);
  console.log(`  Total records: ${fmrCount[0]?.count || 0}`);
  console.log(`  Counties with data: ${fmrCounties[0]?.count || 0}`);
  console.log(`  Fiscal years: ${fmrYears.map(r => r.fiscal_year).join(', ') || 'N/A'}`);

  // Census
  const censusCount = await sql`SELECT COUNT(*) as count FROM census_demographics`;
  const censusYears = await sql`
    SELECT DISTINCT survey_year FROM census_demographics ORDER BY survey_year DESC LIMIT 5
  `;
  const censusCounties = await sql`
    SELECT COUNT(DISTINCT geo_id) as count FROM census_demographics WHERE geo_type = 'county'
  `;
  console.log(`\ncensus_demographics:`);
  console.log(`  Total records: ${censusCount[0]?.count || 0}`);
  console.log(`  Counties with data: ${censusCounties[0]?.count || 0}`);
  console.log(`  Survey years: ${censusYears.map(r => r.survey_year).join(', ') || 'N/A'}`);

  // BLS
  const blsCount = await sql`SELECT COUNT(*) as count FROM bls_employment`;
  const blsYearRange = await sql`
    SELECT MIN(year) as min_year, MAX(year) as max_year FROM bls_employment
  `;
  const blsCounties = await sql`
    SELECT COUNT(DISTINCT county_code) as count FROM bls_employment WHERE county_code IS NOT NULL
  `;
  const blsLatestMonth = await sql`
    SELECT year, month FROM bls_employment ORDER BY year DESC, month DESC LIMIT 1
  `;
  console.log(`\nbls_employment:`);
  console.log(`  Total records: ${blsCount[0]?.count || 0}`);
  console.log(`  Counties with data: ${blsCounties[0]?.count || 0}`);
  console.log(`  Year range: ${blsYearRange[0]?.min_year || 'N/A'} - ${blsYearRange[0]?.max_year || 'N/A'}`);
  console.log(`  Latest data: ${blsLatestMonth[0]?.year || 'N/A'}-${String(blsLatestMonth[0]?.month || '').padStart(2, '0') || 'N/A'}`);

  // === Infrastructure ===
  console.log('\n## Infrastructure (CCN, Flood Zones)');
  console.log('');

  const ccnCount = await sql`SELECT COUNT(*) as count FROM ccn_areas`;
  const ccnByType = await sql`
    SELECT service_type, COUNT(*) as count
    FROM ccn_areas
    GROUP BY service_type
    ORDER BY count DESC
  `;
  const ccnCounties = await sql`
    SELECT COUNT(DISTINCT county) as count FROM ccn_areas WHERE county IS NOT NULL
  `;
  console.log(`ccn_areas:`);
  console.log(`  Total: ${ccnCount[0]?.count || 0}`);
  if (ccnByType.length > 0) {
    console.log(`  By service type:`);
    for (const row of ccnByType) {
      console.log(`    ${row.service_type}: ${row.count}`);
    }
  }
  console.log(`  Counties covered: ${ccnCounties[0]?.count || 0}`);

  const floodCount = await sql`SELECT COUNT(*) as count FROM flood_zones`;
  console.log(`\nflood_zones:`);
  console.log(`  Total: ${floodCount[0]?.count || 0}`);

  // === Reference Data ===
  console.log('\n## Reference Data');
  console.log('');

  const txCounties = await sql`SELECT COUNT(*) as count FROM texas_counties`;
  console.log(`texas_counties: ${txCounties[0]?.count || 0}`);

  // === Top Counties by Data Coverage ===
  console.log('\n## Top Counties by MH Community Count');
  console.log('');
  const topCounties = await sql`
    SELECT county, COUNT(*) as count
    FROM mh_communities
    GROUP BY county
    ORDER BY count DESC
    LIMIT 10
  `;
  for (const row of topCounties) {
    console.log(`  ${row.county}: ${row.count}`);
  }

  // === Data Quality Checks ===
  console.log('\n## Data Quality Checks');
  console.log('');

  // Check for communities with liens data
  const commWithLiens = await sql`
    SELECT COUNT(DISTINCT mc.id) as count
    FROM mh_communities mc
    INNER JOIN mh_ownership_records mor ON UPPER(mor.install_county) = UPPER(mc.county)
    INNER JOIN mh_tax_liens mtl ON UPPER(mtl.county) = UPPER(mc.county)
  `;
  console.log(`Communities in counties with lien data: ${commWithLiens[0]?.count || 0}`);

  // Check for FMR coverage of community counties
  const commWithFMR = await sql`
    SELECT COUNT(DISTINCT mc.id) as count
    FROM mh_communities mc
    INNER JOIN hud_fair_market_rents hfr ON UPPER(hfr.county_name) LIKE '%' || UPPER(mc.county) || '%'
  `;
  console.log(`Communities in counties with FMR data: ${commWithFMR[0]?.count || 0}`);

  console.log('\n=== Verification Complete ===');
}

verifyData().catch(console.error);
