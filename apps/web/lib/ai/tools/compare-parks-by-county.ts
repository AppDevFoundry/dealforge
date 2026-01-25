/**
 * Compare Parks by County Tool
 *
 * Compares distress metrics across multiple Texas counties
 * to help identify the best markets for acquisition.
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

const compareParksByCountySchema = z.object({
  counties: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe(
      'List of Texas county names to compare (e.g., ["Harris", "Dallas", "Tarrant"]). Max 10 counties.'
    ),
  metric: z
    .enum(['parkCount', 'avgDistressScore', 'totalTaxOwed', 'avgLienCount'])
    .default('avgDistressScore')
    .describe('Primary metric to rank counties by'),
});

type CompareParksByCountyParams = z.infer<typeof compareParksByCountySchema>;

export interface CountyData {
  county: string;
  parkCount: number;
  totalLots: number;
  avgDistressScore: number;
  highDistressParks: number;
  totalActiveLiens: number;
  totalTaxOwed: number;
  avgLiensPerPark: number;
}

export const compareParksByCounty = tool({
  description:
    'Compare distressed park metrics across multiple Texas counties. Useful for identifying which markets have the most acquisition opportunities.',
  inputSchema: compareParksByCountySchema,
  execute: async (params: CompareParksByCountyParams, _options) => {
    const { counties, metric } = params;
    const sql = getSql();

    // Normalize county names
    const normalizedCounties = counties.map((c: string) => c.toUpperCase());

    // Query for each county's metrics
    const rows = await sql`
      SELECT
        c.county,
        COUNT(DISTINCT c.id) as park_count,
        COALESCE(AVG(c.distress_score), 0) as avg_distress_score,
        SUM(c.lot_count) as total_lots,
        COUNT(DISTINCT c.id) FILTER (WHERE c.distress_score >= 60) as high_distress_parks,
        COUNT(l.id) FILTER (WHERE l.status = 'active') as total_active_liens,
        COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
        COALESCE(AVG(
          CASE WHEN l.status = 'active' THEN 1 ELSE 0 END
        ), 0) as avg_lien_rate
      FROM mh_communities c
      LEFT JOIN mh_tax_liens l
        ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
        AND UPPER(l.payer_city) = UPPER(c.city)
      WHERE UPPER(c.county) = ANY(${normalizedCounties})
      GROUP BY c.county
      ORDER BY
        CASE
          WHEN ${metric} = 'parkCount' THEN COUNT(DISTINCT c.id)
          WHEN ${metric} = 'avgDistressScore' THEN COALESCE(AVG(c.distress_score), 0)
          WHEN ${metric} = 'totalTaxOwed' THEN COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0)
          WHEN ${metric} = 'avgLienCount' THEN COUNT(l.id) FILTER (WHERE l.status = 'active')::numeric / NULLIF(COUNT(DISTINCT c.id), 0)
          ELSE COALESCE(AVG(c.distress_score), 0)
        END DESC
    `;

    // Build county comparison data
    const countyData: CountyData[] = rows.map((row: Record<string, unknown>) => ({
      county: row.county as string,
      parkCount: Number(row.park_count) || 0,
      totalLots: Number(row.total_lots) || 0,
      avgDistressScore: Math.round((Number(row.avg_distress_score) || 0) * 10) / 10,
      highDistressParks: Number(row.high_distress_parks) || 0,
      totalActiveLiens: Number(row.total_active_liens) || 0,
      totalTaxOwed: Number(row.total_tax_owed) || 0,
      avgLiensPerPark:
        Number(row.park_count) > 0
          ? Math.round((Number(row.total_active_liens) / Number(row.park_count)) * 10) / 10
          : 0,
    }));

    // Calculate statewide comparison (all counties combined)
    const statewide = {
      totalParks: countyData.reduce((sum, c) => sum + c.parkCount, 0),
      totalLots: countyData.reduce((sum, c) => sum + c.totalLots, 0),
      avgDistressScore:
        countyData.length > 0
          ? Math.round(
              (countyData.reduce((sum, c) => sum + c.avgDistressScore * c.parkCount, 0) /
                countyData.reduce((sum, c) => sum + c.parkCount, 0)) *
                10
            ) / 10
          : 0,
      totalActiveLiens: countyData.reduce((sum, c) => sum + c.totalActiveLiens, 0),
      totalTaxOwed: countyData.reduce((sum, c) => sum + c.totalTaxOwed, 0),
    };

    // Find missing counties (requested but no data)
    const foundCounties = countyData.map((c) => c.county.toUpperCase());
    const missingCounties = normalizedCounties.filter((c: string) => !foundCounties.includes(c));

    // Rank counties
    const ranked = [...countyData].sort((a, b) => {
      switch (metric) {
        case 'parkCount':
          return b.parkCount - a.parkCount;
        case 'avgDistressScore':
          return b.avgDistressScore - a.avgDistressScore;
        case 'totalTaxOwed':
          return b.totalTaxOwed - a.totalTaxOwed;
        case 'avgLienCount':
          return b.avgLiensPerPark - a.avgLiensPerPark;
        default:
          return b.avgDistressScore - a.avgDistressScore;
      }
    });

    return {
      counties: countyData,
      ranking: ranked.map((c) => c.county),
      statewideSummary: statewide,
      missingCounties: missingCounties.map((c: string) => c.charAt(0) + c.slice(1).toLowerCase()),
      comparisonMetric: metric,
      insights: generateInsights(countyData, metric),
    };
  },
});

function generateInsights(counties: CountyData[], metric: string): string[] {
  const insights: string[] = [];

  if (counties.length === 0) {
    return ['No data found for the specified counties'];
  }

  // Find top county by metric
  const topCounty = counties[0];
  if (topCounty) {
    switch (metric) {
      case 'parkCount':
        insights.push(
          `${topCounty.county} has the most parks (${topCounty.parkCount}) among compared counties`
        );
        break;
      case 'avgDistressScore':
        insights.push(
          `${topCounty.county} has the highest average distress score (${topCounty.avgDistressScore})`
        );
        break;
      case 'totalTaxOwed':
        insights.push(
          `${topCounty.county} has the highest total tax debt ($${topCounty.totalTaxOwed.toLocaleString()})`
        );
        break;
      case 'avgLienCount':
        insights.push(
          `${topCounty.county} has the highest lien concentration (${topCounty.avgLiensPerPark} liens per park)`
        );
        break;
    }
  }

  // High distress concentration
  const highDistressCounties = counties.filter((c) => c.highDistressParks >= 3);
  if (highDistressCounties.length > 0) {
    insights.push(
      `Counties with 3+ high-distress parks: ${highDistressCounties.map((c) => c.county).join(', ')}`
    );
  }

  // Large tax debt opportunities
  const highDebtCounties = counties.filter((c) => c.totalTaxOwed >= 100000);
  if (highDebtCounties.length > 0) {
    insights.push(
      `Counties with $100K+ in outstanding tax liens: ${highDebtCounties.map((c) => c.county).join(', ')}`
    );
  }

  return insights;
}
