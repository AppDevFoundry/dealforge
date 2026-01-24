/**
 * Calculate Distress Scores for MH Communities
 *
 * This script calculates a 0-100 distress score for each mobile home park
 * based on tax lien data. The score helps identify acquisition opportunities
 * by ranking parks by their financial distress signals.
 *
 * Algorithm (weighted components):
 * - Lien Density (40%): Active liens / lot count ratio
 * - Tax Burden (30%): Total tax owed / (lot count * $10,000) ratio
 * - Lien Recency (20%): How recent the most recent lien is
 * - Chronic Issues (10%): Number of consecutive years with liens
 */

import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment from monorepo root
config({ path: '../../.env.local' });

// Weights for score components
const WEIGHTS = {
  lienDensity: 0.4,
  taxBurden: 0.3,
  lienRecency: 0.2,
  chronicIssues: 0.1,
};

interface ParkLienStats {
  communityId: string;
  name: string;
  lotCount: number | null;
  activeLienCount: number;
  totalTaxOwed: number;
  mostRecentLienDate: string | null;
  taxYearsWithLiens: number[];
}

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

/**
 * Calculate the lien density score (0-100)
 * Formula: min(100, (activeLienCount / lotCount) * 100)
 */
function calculateLienDensityScore(activeLiens: number, lotCount: number | null): number {
  if (!lotCount || lotCount === 0) return 0;
  return Math.min(100, (activeLiens / lotCount) * 100);
}

/**
 * Calculate the tax burden score (0-100)
 * Formula: min(100, (totalTaxOwed / (lotCount * 10000)) * 100)
 * This assumes $10,000 per lot as a high-distress threshold
 */
function calculateTaxBurdenScore(totalTaxOwed: number, lotCount: number | null): number {
  if (!lotCount || lotCount === 0) return 0;
  const threshold = lotCount * 10000;
  return Math.min(100, (totalTaxOwed / threshold) * 100);
}

/**
 * Calculate the lien recency score (0-100)
 * <6 months = 100
 * 6-12 months = 70
 * 12-24 months = 40
 * >24 months = 20
 */
function calculateLienRecencyScore(mostRecentLienDate: string | null): number {
  if (!mostRecentLienDate) return 0;

  const lienDate = new Date(mostRecentLienDate);
  const now = new Date();
  const monthsDiff =
    (now.getFullYear() - lienDate.getFullYear()) * 12 + (now.getMonth() - lienDate.getMonth());

  if (monthsDiff < 6) return 100;
  if (monthsDiff < 12) return 70;
  if (monthsDiff < 24) return 40;
  return 20;
}

/**
 * Calculate chronic issues score (0-100)
 * 1 year = 25
 * 2 years = 50
 * 3 years = 75
 * 4+ years = 100
 */
function calculateChronicIssuesScore(taxYearsWithLiens: number[]): number {
  const uniqueYears = new Set(taxYearsWithLiens).size;
  if (uniqueYears === 0) return 0;
  if (uniqueYears === 1) return 25;
  if (uniqueYears === 2) return 50;
  if (uniqueYears === 3) return 75;
  return 100;
}

/**
 * Calculate the overall distress score (0-100)
 */
function calculateDistressScore(stats: ParkLienStats): number {
  const lienDensity = calculateLienDensityScore(stats.activeLienCount, stats.lotCount);
  const taxBurden = calculateTaxBurdenScore(stats.totalTaxOwed, stats.lotCount);
  const recency = calculateLienRecencyScore(stats.mostRecentLienDate);
  const chronic = calculateChronicIssuesScore(stats.taxYearsWithLiens);

  return (
    lienDensity * WEIGHTS.lienDensity +
    taxBurden * WEIGHTS.taxBurden +
    recency * WEIGHTS.lienRecency +
    chronic * WEIGHTS.chronicIssues
  );
}

async function main() {
  console.log('Starting distress score calculation...\n');
  const sql = getSql();

  // Fetch all parks with their lien stats using address matching
  console.log('Fetching park lien statistics...');
  const parkStats = await sql`
    SELECT
      c.id as community_id,
      c.name,
      c.lot_count,
      COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
      COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
      MAX(l.lien_date) as most_recent_lien_date,
      ARRAY_AGG(DISTINCT l.tax_year ORDER BY l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years
    FROM mh_communities c
    LEFT JOIN mh_tax_liens l
      ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
      AND UPPER(l.payer_city) = UPPER(c.city)
    WHERE c.lot_count IS NOT NULL AND c.lot_count > 0
    GROUP BY c.id, c.name, c.lot_count
  `;

  console.log(`Found ${parkStats.length} parks with lot counts\n`);

  // Calculate scores and prepare updates
  const updates: { id: string; score: number; name: string }[] = [];
  let parksWithLiens = 0;
  let maxScore = 0;
  let minScoreWithLiens = 100;

  for (const row of parkStats) {
    const stats: ParkLienStats = {
      communityId: row.community_id as string,
      name: (row.name as string) || 'Unknown',
      lotCount: row.lot_count as number | null,
      activeLienCount: Number(row.active_lien_count) || 0,
      totalTaxOwed: Number(row.total_tax_owed) || 0,
      mostRecentLienDate: (row.most_recent_lien_date as string) || null,
      taxYearsWithLiens: (row.tax_years as number[]) || [],
    };

    const score = calculateDistressScore(stats);

    // Round to 2 decimal places
    const roundedScore = Math.round(score * 100) / 100;

    updates.push({
      id: stats.communityId,
      score: roundedScore,
      name: stats.name,
    });

    if (stats.activeLienCount > 0) {
      parksWithLiens++;
      maxScore = Math.max(maxScore, roundedScore);
      if (roundedScore > 0) {
        minScoreWithLiens = Math.min(minScoreWithLiens, roundedScore);
      }
    }
  }

  // Batch update scores
  console.log('Updating distress scores...');
  const now = new Date().toISOString();
  let updated = 0;

  // Update in batches of 100
  const batchSize = 100;
  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);

    for (const update of batch) {
      await sql`
        UPDATE mh_communities
        SET distress_score = ${update.score},
            distress_updated_at = ${now}
        WHERE id = ${update.id}
      `;
      updated++;
    }

    process.stdout.write(`\rUpdated ${updated}/${updates.length} parks...`);
  }

  console.log('\n');

  // Print summary
  console.log('=== Distress Score Calculation Complete ===');
  console.log(`Total parks processed: ${updates.length}`);
  console.log(`Parks with active liens: ${parksWithLiens}`);
  console.log(`Parks without liens: ${updates.length - parksWithLiens}`);
  console.log(`Max distress score: ${maxScore.toFixed(2)}`);
  console.log(`Min distress score (with liens): ${minScoreWithLiens.toFixed(2)}`);

  // Show top 10 most distressed parks
  const topDistressed = updates.filter((u) => u.score > 0).sort((a, b) => b.score - a.score);

  if (topDistressed.length > 0) {
    console.log('\nTop 10 Most Distressed Parks:');
    topDistressed.slice(0, 10).forEach((park, i) => {
      console.log(`  ${i + 1}. ${park.name} - Score: ${park.score.toFixed(2)}`);
    });
  }

  console.log('\nDone!');
}

main().catch(console.error);
