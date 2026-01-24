/**
 * Get Market Overview Tool
 *
 * Provides market statistics and trends for mobile home parks
 * in a specific county or statewide.
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

const getMarketOverviewSchema = z.object({
  county: z
    .string()
    .optional()
    .describe('Texas county name to analyze. If omitted, returns statewide data.'),
  includeRecentActivity: z
    .boolean()
    .default(true)
    .describe('Whether to include recent lien activity trends'),
});

type GetMarketOverviewParams = z.infer<typeof getMarketOverviewSchema>;

export const getMarketOverview = tool({
  description:
    'Get market statistics and trends for mobile home parks in a specific Texas county or statewide. Includes park counts, lot inventory, distress metrics, and recent activity.',
  inputSchema: getMarketOverviewSchema,
  execute: async (params: GetMarketOverviewParams, _options) => {
    const { county, includeRecentActivity } = params;
    const sql = getSql();

    // Build the where clause
    const countyFilter = county ? sql`WHERE UPPER(c.county) = ${county.toUpperCase()}` : sql``;

    // Get basic market stats
    const statsRows = await sql`
      SELECT
        COUNT(DISTINCT c.id) as total_parks,
        COALESCE(SUM(c.lot_count), 0) as total_lots,
        COALESCE(AVG(c.lot_count), 0) as avg_lot_count,
        COALESCE(AVG(c.estimated_occupancy), 0) as avg_occupancy,
        COUNT(DISTINCT c.id) FILTER (WHERE c.distress_score IS NOT NULL) as parks_with_distress_data,
        COALESCE(AVG(c.distress_score), 0) as avg_distress_score,
        COUNT(DISTINCT c.id) FILTER (WHERE c.distress_score >= 60) as high_distress_parks,
        COUNT(DISTINCT c.id) FILTER (WHERE c.distress_score >= 30 AND c.distress_score < 60) as medium_distress_parks,
        COUNT(DISTINCT c.id) FILTER (WHERE c.distress_score < 30 OR c.distress_score IS NULL) as low_distress_parks,
        COUNT(DISTINCT c.county) as county_count,
        MIN(c.lot_count) as min_lot_count,
        MAX(c.lot_count) as max_lot_count
      FROM mh_communities c
      ${countyFilter}
    `;

    const stats = statsRows[0]!;

    // Get property type distribution
    const typeDistribution = await sql`
      SELECT
        COALESCE(property_type, 'unknown') as property_type,
        COUNT(*) as count
      FROM mh_communities c
      ${countyFilter}
      GROUP BY property_type
      ORDER BY count DESC
    `;

    // Get lot count distribution (size buckets)
    const sizeDistribution = await sql`
      SELECT
        CASE
          WHEN lot_count IS NULL THEN 'Unknown'
          WHEN lot_count < 25 THEN 'Small (< 25 lots)'
          WHEN lot_count < 75 THEN 'Medium (25-74 lots)'
          WHEN lot_count < 150 THEN 'Large (75-149 lots)'
          ELSE 'Very Large (150+ lots)'
        END as size_category,
        COUNT(*) as count
      FROM mh_communities c
      ${countyFilter}
      GROUP BY
        CASE
          WHEN lot_count IS NULL THEN 'Unknown'
          WHEN lot_count < 25 THEN 'Small (< 25 lots)'
          WHEN lot_count < 75 THEN 'Medium (25-74 lots)'
          WHEN lot_count < 150 THEN 'Large (75-149 lots)'
          ELSE 'Very Large (150+ lots)'
        END
      ORDER BY count DESC
    `;

    // Get lien activity summary
    const lienCountyFilter = county
      ? sql`WHERE UPPER(l.payer_city) IN (
          SELECT UPPER(city) FROM mh_communities WHERE UPPER(county) = ${county.toUpperCase()}
        )`
      : sql``;

    const lienStats = await sql`
      SELECT
        COUNT(*) as total_liens,
        COUNT(*) FILTER (WHERE status = 'active') as active_liens,
        COALESCE(SUM(tax_amount) FILTER (WHERE status = 'active'), 0) as total_active_debt,
        COALESCE(AVG(tax_amount), 0) as avg_lien_amount,
        COUNT(DISTINCT tax_year) as tax_years_represented
      FROM mh_tax_liens l
      ${lienCountyFilter}
    `;

    const liens = lienStats[0]!;

    // Build response
    const response: Record<string, unknown> = {
      scope: county ? `${county} County` : 'Texas Statewide',
      summary: {
        totalParks: Number(stats.total_parks) || 0,
        totalLots: Number(stats.total_lots) || 0,
        avgLotCount: Math.round(Number(stats.avg_lot_count) || 0),
        avgOccupancy: Math.round((Number(stats.avg_occupancy) || 0) * 10) / 10,
        countyCount: Number(stats.county_count) || 0,
        lotCountRange: {
          min: Number(stats.min_lot_count) || 0,
          max: Number(stats.max_lot_count) || 0,
        },
      },
      distressMetrics: {
        parksWithDistressData: Number(stats.parks_with_distress_data) || 0,
        avgDistressScore: Math.round((Number(stats.avg_distress_score) || 0) * 10) / 10,
        distribution: {
          high: Number(stats.high_distress_parks) || 0,
          medium: Number(stats.medium_distress_parks) || 0,
          low: Number(stats.low_distress_parks) || 0,
        },
      },
      lienSummary: {
        totalLiens: Number(liens.total_liens) || 0,
        activeLiens: Number(liens.active_liens) || 0,
        totalActiveDebt: Number(liens.total_active_debt) || 0,
        avgLienAmount: Math.round(Number(liens.avg_lien_amount) || 0),
        taxYearsRepresented: Number(liens.tax_years_represented) || 0,
      },
      propertyTypeDistribution: typeDistribution.map((row: Record<string, unknown>) => ({
        type: row.property_type as string,
        count: Number(row.count) || 0,
      })),
      sizeDistribution: sizeDistribution.map((row: Record<string, unknown>) => ({
        category: row.size_category as string,
        count: Number(row.count) || 0,
      })),
    };

    // Add recent activity if requested
    if (includeRecentActivity) {
      const recentFilter = county
        ? sql`WHERE UPPER(l.payer_city) IN (
            SELECT UPPER(city) FROM mh_communities WHERE UPPER(county) = ${county.toUpperCase()}
          )`
        : sql``;

      const recentActivity = await sql`
        SELECT
          tax_year,
          COUNT(*) as new_liens,
          COUNT(*) FILTER (WHERE status = 'active') as still_active,
          COALESCE(SUM(tax_amount), 0) as total_amount
        FROM mh_tax_liens l
        ${recentFilter}
        GROUP BY tax_year
        ORDER BY tax_year DESC
        LIMIT 5
      `;

      response.recentActivity = recentActivity.map((row: Record<string, unknown>) => ({
        year: row.tax_year as number,
        newLiens: Number(row.new_liens) || 0,
        stillActive: Number(row.still_active) || 0,
        totalAmount: Number(row.total_amount) || 0,
      }));
    }

    // Generate market insights
    response.insights = generateMarketInsights(response);

    return response;
  },
});

function generateMarketInsights(data: Record<string, unknown>): string[] {
  const insights: string[] = [];

  const summary = data.summary as {
    totalParks: number;
    totalLots: number;
    avgLotCount: number;
    avgOccupancy: number;
  };

  const distress = data.distressMetrics as {
    avgDistressScore: number;
    distribution: { high: number; medium: number; low: number };
  };

  const liens = data.lienSummary as {
    activeLiens: number;
    totalActiveDebt: number;
  };

  // Market size insight
  if (summary.totalParks > 0) {
    insights.push(
      `Market contains ${summary.totalParks} parks with ${summary.totalLots.toLocaleString()} total lots`
    );
  }

  // Distress concentration insight
  if (distress.distribution.high > 0) {
    const highDistressPercent = Math.round((distress.distribution.high / summary.totalParks) * 100);
    insights.push(
      `${distress.distribution.high} parks (${highDistressPercent}%) show high distress signals`
    );
  }

  // Average distress insight
  if (distress.avgDistressScore >= 40) {
    insights.push(
      `Average distress score of ${distress.avgDistressScore} indicates significant market stress`
    );
  } else if (distress.avgDistressScore >= 20) {
    insights.push(`Moderate distress levels with average score of ${distress.avgDistressScore}`);
  }

  // Tax debt insight
  if (liens.totalActiveDebt >= 100000) {
    insights.push(
      `$${liens.totalActiveDebt.toLocaleString()} in active tax liens represents acquisition opportunity`
    );
  }

  // Occupancy insight
  if (summary.avgOccupancy > 0 && summary.avgOccupancy < 80) {
    insights.push(
      `Average occupancy of ${summary.avgOccupancy}% suggests value-add potential through lease-up`
    );
  }

  return insights;
}
