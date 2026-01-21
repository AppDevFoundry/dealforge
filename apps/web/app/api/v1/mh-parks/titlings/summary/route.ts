import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { getDb } from '@dealforge/database/client';
import { mhTitlings } from '@dealforge/database/schema';
import type { TitlingCountySummary, TitlingMonthlyTotal, TitlingSummary } from '@dealforge/types';
import { asc, desc, gte, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const db = getDb();

    // Get last 12 months of data
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    const startDate = `${twelveMonthsAgo.getFullYear()}-${String(twelveMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

    // Monthly totals (aggregated across all counties)
    const monthlyRows = await db
      .select({
        month: mhTitlings.month,
        newTitles: sql<number>`COALESCE(SUM(${mhTitlings.newTitles}), 0)::int`,
        transfers: sql<number>`COALESCE(SUM(${mhTitlings.transfers}), 0)::int`,
        totalActive: sql<number>`COALESCE(SUM(${mhTitlings.totalActive}), 0)::int`,
      })
      .from(mhTitlings)
      .where(gte(mhTitlings.month, startDate))
      .groupBy(mhTitlings.month)
      .orderBy(asc(mhTitlings.month));

    const monthlyTotals: TitlingMonthlyTotal[] = monthlyRows.map((row) => ({
      month: String(row.month),
      newTitles: row.newTitles,
      transfers: row.transfers,
      totalActive: row.totalActive,
    }));

    // Top counties by total activity (new titles + transfers)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const recentStart = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

    const countyRows = await db
      .select({
        county: mhTitlings.county,
        newTitles: sql<number>`COALESCE(SUM(${mhTitlings.newTitles}), 0)::int`,
        transfers: sql<number>`COALESCE(SUM(${mhTitlings.transfers}), 0)::int`,
      })
      .from(mhTitlings)
      .where(gte(mhTitlings.month, recentStart))
      .groupBy(mhTitlings.county)
      .orderBy(desc(sql`SUM(${mhTitlings.newTitles}) + SUM(${mhTitlings.transfers})`))
      .limit(20);

    // Calculate trend (compare last 3 months vs prior 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const trendStart = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`;

    const recentActivity = await db
      .select({
        county: mhTitlings.county,
        total: sql<number>`COALESCE(SUM(${mhTitlings.newTitles}) + SUM(${mhTitlings.transfers}), 0)::int`,
      })
      .from(mhTitlings)
      .where(gte(mhTitlings.month, trendStart))
      .groupBy(mhTitlings.county);

    const priorActivity = await db
      .select({
        county: mhTitlings.county,
        total: sql<number>`COALESCE(SUM(${mhTitlings.newTitles}) + SUM(${mhTitlings.transfers}), 0)::int`,
      })
      .from(mhTitlings)
      .where(sql`${mhTitlings.month} >= ${recentStart} AND ${mhTitlings.month} < ${trendStart}`)
      .groupBy(mhTitlings.county);

    const priorMap = new Map(priorActivity.map((r) => [r.county, r.total]));
    const recentMap = new Map(recentActivity.map((r) => [r.county, r.total]));

    const topCounties: TitlingCountySummary[] = countyRows.map((row) => {
      const recent = recentMap.get(row.county) ?? 0;
      const prior = priorMap.get(row.county) ?? 0;
      const trend = prior > 0 ? ((recent - prior) / prior) * 100 : 0;

      return {
        county: row.county,
        newTitles: row.newTitles,
        transfers: row.transfers,
        trend: Math.round(trend * 10) / 10,
      };
    });

    const summary: TitlingSummary = {
      monthlyTotals,
      topCounties,
    };

    return createSuccessResponse(summary);
  } catch (error) {
    console.error('Error fetching titling summary:', error);
    return ApiErrors.internalError('Failed to fetch titling summary');
  }
}
