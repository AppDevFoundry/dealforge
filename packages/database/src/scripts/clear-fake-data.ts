/**
 * Clear Fake/Demo Data Script
 *
 * Removes synthetic data while preserving real imports from:
 * - TDHCA (titles, liens)
 * - HUD Fair Market Rents
 * - Census Demographics
 * - BLS Employment
 *
 * Usage:
 *   pnpm --filter @dealforge/database clear:fake           # Dry run
 *   pnpm --filter @dealforge/database clear:fake --execute # Actually delete
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment
config({ path: '../../.env.local' });

interface ClearResult {
  table: string;
  countBefore: number;
  countAfter: number;
  deleted: number;
}

async function clearFakeData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const execute = process.argv.includes('--execute');
  const sql = neon(databaseUrl);

  console.log('Clear Fake/Demo Data');
  console.log('====================');
  console.log(`Mode: ${execute ? 'EXECUTE (will delete data)' : 'DRY RUN (preview only)'}`);
  console.log('');

  const results: ClearResult[] = [];

  // 1. Clear demo deals and related data (fake data)
  console.log('Checking deals and related tables...');
  const dealCountBefore = await sql`SELECT COUNT(*) as count FROM deals`;
  if (execute) {
    await sql`DELETE FROM deal_tags`;
    await sql`DELETE FROM deals`;
  }
  const dealCountAfter = execute
    ? await sql`SELECT COUNT(*) as count FROM deals`
    : dealCountBefore;
  results.push({
    table: 'deals + deal_tags',
    countBefore: Number(dealCountBefore[0]?.count) || 0,
    countAfter: Number(dealCountAfter[0]?.count) || 0,
    deleted: (Number(dealCountBefore[0]?.count) || 0) - (execute ? Number(dealCountAfter[0]?.count) || 0 : 0),
  });

  // 2. Clear synthetic MH communities (keep TDHCA-discovered ones)
  console.log('Checking mh_communities...');
  const mhCommBefore = await sql`SELECT COUNT(*) as count FROM mh_communities`;
  const synthMhComm = await sql`
    SELECT COUNT(*) as count FROM mh_communities
    WHERE source NOT IN ('tdhca_clustering', 'tdhca', 'cad')
  `;
  if (execute) {
    await sql`
      DELETE FROM mh_communities
      WHERE source NOT IN ('tdhca_clustering', 'tdhca', 'cad')
    `;
  }
  const mhCommAfter = execute
    ? await sql`SELECT COUNT(*) as count FROM mh_communities`
    : mhCommBefore;
  results.push({
    table: 'mh_communities (synthetic)',
    countBefore: Number(mhCommBefore[0]?.count) || 0,
    countAfter: execute
      ? Number(mhCommAfter[0]?.count) || 0
      : (Number(mhCommBefore[0]?.count) || 0) - (Number(synthMhComm[0]?.count) || 0),
    deleted: Number(synthMhComm[0]?.count) || 0,
  });

  // 3. Clear synthetic MH titlings (keep real TDHCA-derived ones)
  console.log('Checking mh_titlings...');
  const titlingsBefore = await sql`SELECT COUNT(*) as count FROM mh_titlings`;
  const synthTitlings = await sql`
    SELECT COUNT(*) as count FROM mh_titlings
    WHERE source != 'tdhca'
  `;
  if (execute) {
    await sql`DELETE FROM mh_titlings WHERE source != 'tdhca'`;
  }
  const titlingsAfter = execute
    ? await sql`SELECT COUNT(*) as count FROM mh_titlings`
    : titlingsBefore;
  results.push({
    table: 'mh_titlings (synthetic)',
    countBefore: Number(titlingsBefore[0]?.count) || 0,
    countAfter: execute
      ? Number(titlingsAfter[0]?.count) || 0
      : (Number(titlingsBefore[0]?.count) || 0) - (Number(synthTitlings[0]?.count) || 0),
    deleted: Number(synthTitlings[0]?.count) || 0,
  });

  // 4. Clear demo user preferences (but keep users for auth)
  console.log('Checking user_preferences...');
  const prefsBefore = await sql`SELECT COUNT(*) as count FROM user_preferences`;
  if (execute) {
    await sql`DELETE FROM user_preferences`;
  }
  const prefsAfter = execute
    ? await sql`SELECT COUNT(*) as count FROM user_preferences`
    : prefsBefore;
  results.push({
    table: 'user_preferences',
    countBefore: Number(prefsBefore[0]?.count) || 0,
    countAfter: Number(prefsAfter[0]?.count) || 0,
    deleted: execute ? Number(prefsBefore[0]?.count) || 0 : 0,
  });

  // Print summary
  console.log('\n--- Summary ---');
  console.log('');
  console.log('Table                        | Before  | After   | Deleted');
  console.log('---------------------------- | ------- | ------- | -------');
  for (const result of results) {
    const tablePad = result.table.padEnd(28);
    const beforePad = String(result.countBefore).padStart(7);
    const afterPad = String(execute ? result.countAfter : '-').padStart(7);
    const deletedPad = String(execute ? result.deleted : `~${result.deleted}`).padStart(7);
    console.log(`${tablePad} | ${beforePad} | ${afterPad} | ${deletedPad}`);
  }

  // Show preserved real data
  console.log('\n--- Preserved Real Data ---');
  const realOwnership = await sql`SELECT COUNT(*) as count FROM mh_ownership_records`;
  const realLiens = await sql`SELECT COUNT(*) as count FROM mh_tax_liens`;
  const realFMR = await sql`SELECT COUNT(*) as count FROM hud_fair_market_rents`;
  const realCensus = await sql`SELECT COUNT(*) as count FROM census_demographics`;
  const realBLS = await sql`SELECT COUNT(*) as count FROM bls_employment`;
  const realCCN = await sql`SELECT COUNT(*) as count FROM ccn_areas`;
  const realMHComm = await sql`
    SELECT COUNT(*) as count FROM mh_communities
    WHERE source IN ('tdhca_clustering', 'tdhca', 'cad')
  `;

  console.log(`  mh_ownership_records: ${realOwnership[0]?.count || 0}`);
  console.log(`  mh_tax_liens: ${realLiens[0]?.count || 0}`);
  console.log(`  mh_communities (real): ${realMHComm[0]?.count || 0}`);
  console.log(`  hud_fair_market_rents: ${realFMR[0]?.count || 0}`);
  console.log(`  census_demographics: ${realCensus[0]?.count || 0}`);
  console.log(`  bls_employment: ${realBLS[0]?.count || 0}`);
  console.log(`  ccn_areas: ${realCCN[0]?.count || 0}`);

  if (!execute) {
    console.log('\n--- DRY RUN - No data was deleted ---');
    console.log('Run with --execute flag to actually delete data.');
  } else {
    console.log('\n--- COMPLETE - Data has been deleted ---');
  }
}

clearFakeData().catch(console.error);
