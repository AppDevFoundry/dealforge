/**
 * Calculate Distress Scores for MH Communities
 *
 * Computes a distress score (0-100) for each MH park based on
 * tax lien signals matched by address fuzzy join.
 *
 * Algorithm:
 * - lienRatio (40%): active liens / lot count
 * - taxBurden (30%): percentile rank of tax per lot
 * - recency (20%): how recent the most recent lien is
 * - persistence (10%): multi-year lien presence
 *
 * Usage:
 *   pnpm --filter @dealforge/database calculate:distress [--county=BEXAR] [--dry-run]
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '../../.env.local' });

interface ParkRow {
  id: string;
  address: string;
  city: string;
  county: string;
  lot_count: number | null;
}

interface LienStats {
  active_liens: number;
  total_tax_owed: number;
  most_recent_lien_date: string | null;
  tax_years_with_liens: number;
}

interface ParkDistressData {
  parkId: string;
  lotCount: number;
  activeLiens: number;
  totalTaxOwed: number;
  mostRecentLienDate: string | null;
  taxYearsWithLiens: number;
  lienRatio: number;
  taxPerLot: number;
  taxBurden: number;
  recency: number;
  persistence: number;
  distressScore: number;
}

function parseArgs(): { county: string | null; dryRun: boolean } {
  const args = process.argv.slice(2);
  let county: string | null = null;
  let dryRun = false;

  for (const arg of args) {
    if (arg.startsWith('--county=')) {
      county = (arg.split('=')[1] || '').toUpperCase();
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  return { county, dryRun };
}

function computeRecencyScore(mostRecentLienDate: string | null): number {
  if (!mostRecentLienDate) return 0;

  const lienDate = new Date(mostRecentLienDate);
  const now = new Date();
  const yearsDiff = (now.getTime() - lienDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

  if (yearsDiff <= 1) return 100;
  if (yearsDiff <= 2) return 75;
  if (yearsDiff <= 3) return 50;
  if (yearsDiff <= 5) return 25;
  return 10;
}

function computePercentileRank(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 0;
  let count = 0;
  for (const v of sortedValues) {
    if (v < value) count++;
    else break;
  }
  return (count / sortedValues.length) * 100;
}

async function calculateDistressScores() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const { county, dryRun } = parseArgs();

  console.log('Distress Score Calculation');
  console.log('==========================');
  console.log(`  County filter: ${county || 'all'}`);
  console.log(`  Dry run: ${dryRun}`);
  console.log('');

  // Step 1: Query all parks with addresses
  const parkRows = county
    ? await sql`
        SELECT id, address, city, county, lot_count
        FROM mh_communities
        WHERE address IS NOT NULL
          AND UPPER(county) = ${county}
      `
    : await sql`
        SELECT id, address, city, county, lot_count
        FROM mh_communities
        WHERE address IS NOT NULL
      `;
  const parks = parkRows as unknown as ParkRow[];

  console.log(`Parks with addresses: ${parks.length}`);

  // Step 2: For each park, query matched liens
  const parkDataList: ParkDistressData[] = [];
  const parksWithLiens: ParkDistressData[] = [];

  for (const park of parks) {
    // Extract address prefix for fuzzy matching (first 15+ chars)
    const addressUpper = park.address.toUpperCase().trim();
    const addressPrefix = addressUpper.substring(0, Math.min(addressUpper.length, 20));
    const cityUpper = park.city.toUpperCase().trim();

    const lienRows = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active_liens,
        COALESCE(SUM(tax_amount) FILTER (WHERE status = 'active'), 0) as total_tax_owed,
        MAX(lien_date) as most_recent_lien_date,
        COUNT(DISTINCT tax_year) FILTER (WHERE status = 'active') as tax_years_with_liens
      FROM mh_tax_liens
      WHERE UPPER(payer_address) LIKE ${'%' + addressPrefix + '%'}
        AND UPPER(payer_city) = ${cityUpper}
    `;

    const stats: LienStats = lienRows[0] as LienStats;
    const activeLiens = Number(stats.active_liens) || 0;
    const totalTaxOwed = Number(stats.total_tax_owed) || 0;
    const taxYearsWithLiens = Number(stats.tax_years_with_liens) || 0;
    const lotCount = Math.max(park.lot_count || 1, 1);

    const lienRatio = Math.min(activeLiens / lotCount, 1.0) * 100;
    const taxPerLot = totalTaxOwed / lotCount;
    const recency = computeRecencyScore(stats.most_recent_lien_date);
    const persistence = Math.min(taxYearsWithLiens / 5, 1.0) * 100;

    const data: ParkDistressData = {
      parkId: park.id,
      lotCount,
      activeLiens,
      totalTaxOwed,
      mostRecentLienDate: stats.most_recent_lien_date,
      taxYearsWithLiens,
      lienRatio,
      taxPerLot,
      taxBurden: 0, // computed in pass 2
      recency,
      persistence,
      distressScore: 0, // computed in pass 2
    };

    parkDataList.push(data);
    if (activeLiens > 0) {
      parksWithLiens.push(data);
    }
  }

  console.log(`Parks with active liens: ${parksWithLiens.length}`);

  // Step 3: Compute percentile-based taxBurden
  const taxPerLotValues = parksWithLiens
    .map((p) => p.taxPerLot)
    .sort((a, b) => a - b);

  for (const data of parkDataList) {
    if (data.activeLiens > 0) {
      data.taxBurden = computePercentileRank(data.taxPerLot, taxPerLotValues);
    }

    // Step 4: Compute final distress score
    data.distressScore = Math.round(
      0.4 * data.lienRatio +
      0.3 * data.taxBurden +
      0.2 * data.recency +
      0.1 * data.persistence
    );
  }

  // Step 5: Batch update parks
  const BATCH_SIZE = 50;
  let updated = 0;
  let zeroed = 0;

  for (let i = 0; i < parkDataList.length; i += BATCH_SIZE) {
    const batch = parkDataList.slice(i, i + BATCH_SIZE);

    for (const data of batch) {
      if (dryRun) {
        if (data.distressScore > 0) {
          console.log(
            `  [DRY RUN] ${data.parkId}: score=${data.distressScore}, ` +
            `liens=${data.activeLiens}, taxOwed=$${data.totalTaxOwed.toFixed(2)}`
          );
        }
        continue;
      }

      if (data.activeLiens > 0) {
        const factors = JSON.stringify({
          lienRatio: Math.round(data.lienRatio * 10) / 10,
          taxBurden: Math.round(data.taxBurden * 10) / 10,
          recency: data.recency,
          persistence: Math.round(data.persistence * 10) / 10,
          activeLienCount: data.activeLiens,
          totalTaxOwed: Math.round(data.totalTaxOwed * 100) / 100,
          taxYearsWithLiens: data.taxYearsWithLiens,
        });

        await sql`
          UPDATE mh_communities
          SET distress_score = ${data.distressScore},
              distress_factors = ${factors}::jsonb,
              distress_updated_at = NOW(),
              updated_at = NOW()
          WHERE id = ${data.parkId}
        `;
        updated++;
      } else {
        await sql`
          UPDATE mh_communities
          SET distress_score = 0,
              distress_factors = NULL,
              distress_updated_at = NOW(),
              updated_at = NOW()
          WHERE id = ${data.parkId}
        `;
        zeroed++;
      }
    }

    if (!dryRun) {
      console.log(`  Processed ${Math.min(i + BATCH_SIZE, parkDataList.length)}/${parkDataList.length} parks...`);
    }
  }

  console.log('\nCalculation complete:');
  console.log(`  Parks scored (with liens): ${updated}`);
  console.log(`  Parks zeroed (no liens): ${zeroed}`);

  if (!dryRun) {
    const topResult = await sql`
      SELECT name, county, distress_score, distress_factors
      FROM mh_communities
      WHERE distress_score > 0
      ORDER BY distress_score DESC
      LIMIT 10
    `;

    if (topResult.length > 0) {
      console.log('\nTop 10 distressed parks:');
      for (const row of topResult) {
        console.log(`  ${row.distress_score} — ${row.name} (${row.county})`);
      }
    }
  }
}

calculateDistressScores().catch(console.error);
