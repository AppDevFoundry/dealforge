/**
 * Export Seed Data Script
 *
 * Exports a subset of real data to JSON files for quick dev database resets.
 * Focuses on the 23 MVP counties in Texas.
 *
 * Output files in data/seed/:
 *   - texas-counties.json         (all 254 Texas counties)
 *   - mh-communities.json         (~500 parks in MVP counties)
 *   - mh-ownership-records.json   (~10,000 records sample)
 *   - mh-tax-liens.json           (active liens in MVP counties)
 *   - hud-fair-market-rents.json  (Texas metros + counties)
 *   - census-demographics.json    (Texas counties)
 *   - bls-employment.json         (last 12 months)
 *   - ccn-areas.json              (MVP counties with WKT geometry)
 *   - manifest.json               (metadata and counts)
 *
 * Usage:
 *   pnpm --filter @dealforge/database seed:export
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Load environment
config({ path: '../../.env.local' });

// MVP Counties for focused seed data
const MVP_COUNTIES = [
  'BEXAR', 'TRAVIS', 'NUECES', 'HIDALGO', 'CAMERON',
  'SAN PATRICIO', 'ARANSAS', 'KLEBERG', 'JIM WELLS', 'REFUGIO',
  'CALHOUN', 'VICTORIA', 'BEE', 'LIVE OAK', 'BROOKS',
  'KARNES', 'WILSON', 'ATASCOSA', 'MCMULLEN', 'LA SALLE',
  'FRIO', 'MEDINA', 'UVALDE', 'GOLIAD', 'STARR',
  'ZAPATA', 'WEBB', 'JIM HOGG', 'KENEDY', 'WILLACY',
];

interface ExportManifest {
  exportedAt: string;
  schemaVersion: string;
  counts: Record<string, number>;
  mvpCounties: string[];
  notes: string[];
}

async function exportSeedData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  // Ensure seed directory exists
  const seedDir = path.resolve(__dirname, '../../../../data/seed');
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true });
  }

  console.log('Export Seed Data');
  console.log('=================');
  console.log(`Output directory: ${seedDir}`);
  console.log('');

  const manifest: ExportManifest = {
    exportedAt: new Date().toISOString(),
    schemaVersion: '1.0.0',
    counts: {},
    mvpCounties: MVP_COUNTIES,
    notes: [],
  };

  // 1. Texas Counties (all 254)
  console.log('Exporting texas_counties...');
  const texasCounties = await sql`
    SELECT id, name, fips_code, region, center_lat, center_lng, is_active, created_at
    FROM texas_counties
    ORDER BY name
  `;
  fs.writeFileSync(
    path.join(seedDir, 'texas-counties.json'),
    JSON.stringify(texasCounties, null, 2)
  );
  manifest.counts['texas-counties'] = texasCounties.length;
  console.log(`  Exported ${texasCounties.length} counties`);

  // 2. MH Communities (MVP counties only)
  console.log('Exporting mh_communities...');
  const mvpCountiesLike = MVP_COUNTIES.map(c => c.toUpperCase());
  const mhCommunities = await sql`
    SELECT id, name, address, city, county, state, zip_code, latitude, longitude,
           lot_count, estimated_occupancy, distress_score, distress_updated_at,
           property_type, owner_name, source, source_updated_at, metadata, created_at, updated_at
    FROM mh_communities
    WHERE UPPER(county) = ANY(${mvpCountiesLike})
    ORDER BY county, city, name
  `;
  fs.writeFileSync(
    path.join(seedDir, 'mh-communities.json'),
    JSON.stringify(mhCommunities, null, 2)
  );
  manifest.counts['mh-communities'] = mhCommunities.length;
  console.log(`  Exported ${mhCommunities.length} communities`);

  // 3. MH Ownership Records (sample from MVP counties, limit 10k)
  console.log('Exporting mh_ownership_records (sample)...');
  const ownershipRecords = await sql`
    SELECT id, certificate_number, label, serial_number, manufacturer_name, model,
           manufacture_date, sections, square_feet, sale_date, seller_name,
           owner_name, owner_address, owner_city, owner_state, owner_zip,
           install_county, install_address, install_city, install_state, install_zip,
           wind_zone, issue_date, election_type, lien_holder_1, lien_date_1,
           source_file, created_at
    FROM mh_ownership_records
    WHERE UPPER(install_county) = ANY(${mvpCountiesLike})
    ORDER BY install_county, created_at DESC
    LIMIT 10000
  `;
  fs.writeFileSync(
    path.join(seedDir, 'mh-ownership-records.json'),
    JSON.stringify(ownershipRecords, null, 2)
  );
  manifest.counts['mh-ownership-records'] = ownershipRecords.length;
  console.log(`  Exported ${ownershipRecords.length} ownership records`);

  // 4. MH Tax Liens (active liens in MVP counties)
  console.log('Exporting mh_tax_liens...');
  const taxLiens = await sql`
    SELECT id, tax_roll_number, payer_name, payer_address, payer_city,
           label, serial_number, county, tax_unit_id, tax_unit_name,
           tax_year, lien_date, release_date, tax_amount, status, source_file, created_at
    FROM mh_tax_liens
    WHERE UPPER(county) = ANY(${mvpCountiesLike})
    ORDER BY county, tax_year DESC
  `;
  fs.writeFileSync(
    path.join(seedDir, 'mh-tax-liens.json'),
    JSON.stringify(taxLiens, null, 2)
  );
  manifest.counts['mh-tax-liens'] = taxLiens.length;
  console.log(`  Exported ${taxLiens.length} tax liens`);

  // 5. HUD Fair Market Rents (Texas only)
  console.log('Exporting hud_fair_market_rents...');
  const fmrData = await sql`
    SELECT id, entity_code, zip_code, county_name, metro_name, state_name, state_code,
           fiscal_year, efficiency, one_bedroom, two_bedroom, three_bedroom, four_bedroom,
           small_area_status, source_updated_at, created_at, updated_at
    FROM hud_fair_market_rents
    WHERE state_code = 'TX' OR state_name = 'Texas'
    ORDER BY fiscal_year DESC, county_name
  `;
  fs.writeFileSync(
    path.join(seedDir, 'hud-fair-market-rents.json'),
    JSON.stringify(fmrData, null, 2)
  );
  manifest.counts['hud-fair-market-rents'] = fmrData.length;
  console.log(`  Exported ${fmrData.length} FMR records`);

  // 6. Census Demographics (Texas counties)
  console.log('Exporting census_demographics...');
  const censusData = await sql`
    SELECT id, geo_id, geo_type, geo_name, state_code, county_code,
           survey_year, total_population, population_growth_rate, median_age,
           median_household_income, per_capita_income, poverty_rate,
           total_housing_units, occupied_housing_units, vacancy_rate,
           owner_occupied_rate, renter_occupied_rate, median_home_value, median_gross_rent,
           mobile_homes_count, mobile_homes_percent, high_school_grad_rate, bachelors_degree_rate,
           source_updated_at, created_at, updated_at
    FROM census_demographics
    WHERE state_code = '48'
    ORDER BY survey_year DESC, geo_name
  `;
  fs.writeFileSync(
    path.join(seedDir, 'census-demographics.json'),
    JSON.stringify(censusData, null, 2)
  );
  manifest.counts['census-demographics'] = censusData.length;
  console.log(`  Exported ${censusData.length} census records`);

  // 7. BLS Employment (Texas counties, last 24 months)
  console.log('Exporting bls_employment...');
  const currentYear = new Date().getFullYear();
  const blsData = await sql`
    SELECT id, area_code, area_name, area_type, state_code, county_code,
           year, month, period_type, labor_force, employed, unemployed, unemployment_rate,
           is_preliminary, source_updated_at, created_at, updated_at
    FROM bls_employment
    WHERE state_code = '48'
      AND year >= ${currentYear - 2}
    ORDER BY year DESC, month DESC, area_name
  `;
  fs.writeFileSync(
    path.join(seedDir, 'bls-employment.json'),
    JSON.stringify(blsData, null, 2)
  );
  manifest.counts['bls-employment'] = blsData.length;
  console.log(`  Exported ${blsData.length} BLS records`);

  // 8. CCN Areas (MVP counties, with WKT geometry)
  console.log('Exporting ccn_areas...');
  const ccnData = await sql`
    SELECT id, ccn_number, utility_name, service_type, county,
           ST_AsText(boundary::geometry) as boundary_wkt,
           source_updated_at, created_at
    FROM ccn_areas
    WHERE UPPER(county) = ANY(${mvpCountiesLike})
    ORDER BY county, utility_name
  `;
  fs.writeFileSync(
    path.join(seedDir, 'ccn-areas.json'),
    JSON.stringify(ccnData, null, 2)
  );
  manifest.counts['ccn-areas'] = ccnData.length;
  console.log(`  Exported ${ccnData.length} CCN areas`);

  // Write manifest
  manifest.notes.push(`Seed data focused on ${MVP_COUNTIES.length} MVP counties in Texas`);
  manifest.notes.push('Ownership records limited to 10,000 (sample)');
  manifest.notes.push('BLS data limited to last 24 months');
  fs.writeFileSync(
    path.join(seedDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log('');
  console.log('--- Export Complete ---');
  console.log(`Total records exported: ${Object.values(manifest.counts).reduce((a, b) => a + b, 0)}`);
  console.log(`Manifest written to: ${path.join(seedDir, 'manifest.json')}`);
}

exportSeedData().catch(console.error);
