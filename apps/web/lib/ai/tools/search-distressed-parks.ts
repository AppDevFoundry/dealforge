/**
 * Search Distressed Parks Tool
 *
 * Searches for distressed mobile home parks based on county,
 * distress score range, lot count, and other criteria.
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

const searchDistressedParksSchema = z.object({
  county: z
    .string()
    .optional()
    .describe('Filter by Texas county name (e.g., "Harris", "Dallas", "Tarrant")'),
  minScore: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Minimum distress score (0-100). Higher scores indicate more distress.'),
  maxScore: z.number().min(0).max(100).optional().describe('Maximum distress score (0-100)'),
  minLots: z.number().int().positive().optional().describe('Minimum number of lots in the park'),
  maxLots: z.number().int().positive().optional().describe('Maximum number of lots in the park'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .default(10)
    .describe('Maximum number of results to return (default: 10, max: 50)'),
  sortBy: z
    .enum(['score', 'lienCount', 'taxOwed', 'lotCount'])
    .default('score')
    .describe('Field to sort results by'),
  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
});

type SearchDistressedParksParams = z.infer<typeof searchDistressedParksSchema>;

export const searchDistressedParks = tool({
  description:
    'Search for distressed mobile home parks by county, distress score range, lot count, and sorting preferences. Returns parks with active tax liens indicating financial distress.',
  inputSchema: searchDistressedParksSchema,
  execute: async (params: SearchDistressedParksParams, _options) => {
    const { county, minScore, maxScore, minLots, maxLots, limit, sortBy, sortOrder } = params;
    const sql = getSql();

    // Build dynamic WHERE clauses
    const conditions: string[] = [];
    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    if (county) {
      conditions.push(`UPPER(c.county) = $${paramIndex}`);
      queryParams.push(county.toUpperCase());
      paramIndex++;
    }

    if (minScore !== undefined) {
      conditions.push(`COALESCE(c.distress_score, 0) >= $${paramIndex}`);
      queryParams.push(minScore);
      paramIndex++;
    }

    if (maxScore !== undefined) {
      conditions.push(`COALESCE(c.distress_score, 0) <= $${paramIndex}`);
      queryParams.push(maxScore);
      paramIndex++;
    }

    if (minLots !== undefined) {
      conditions.push(`c.lot_count >= $${paramIndex}`);
      queryParams.push(minLots);
      paramIndex++;
    }

    if (maxLots !== undefined) {
      conditions.push(`c.lot_count <= $${paramIndex}`);
      queryParams.push(maxLots);
      paramIndex++;
    }

    // Map sortBy to actual column names
    const sortColumnMap: Record<string, string> = {
      score: 'COALESCE(c.distress_score, 0)',
      lienCount: 'active_lien_count',
      taxOwed: 'total_tax_owed',
      lotCount: 'c.lot_count',
    };
    const orderColumn = sortColumnMap[sortBy] || 'COALESCE(c.distress_score, 0)';
    const orderDir = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Build the query
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT
        c.id as community_id,
        c.name,
        c.address,
        c.city,
        c.county,
        c.lot_count,
        c.latitude,
        c.longitude,
        COALESCE(c.distress_score, 0) as distress_score,
        c.distress_updated_at,
        COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
        COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
        COUNT(DISTINCT l.tax_year) FILTER (WHERE l.status = 'active') as tax_years_with_liens,
        MAX(l.lien_date) as most_recent_lien_date
      FROM mh_communities c
      LEFT JOIN mh_tax_liens l
        ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
        AND UPPER(l.payer_city) = UPPER(c.city)
      ${whereClause}
      GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count,
               c.latitude, c.longitude, c.distress_score, c.distress_updated_at
      HAVING COUNT(l.id) FILTER (WHERE l.status = 'active') > 0
         OR COALESCE(c.distress_score, 0) > 0
      ORDER BY ${orderColumn} ${orderDir} NULLS LAST
      LIMIT ${limit}
    `;

    const rows = await sql(query, queryParams);

    const parks = rows.map((row: Record<string, unknown>) => ({
      communityId: row.community_id as string,
      name: (row.name as string) || 'Unknown',
      address: (row.address as string) || null,
      city: (row.city as string) || '',
      county: (row.county as string) || '',
      lotCount: row.lot_count as number | null,
      latitude: row.latitude as number | null,
      longitude: row.longitude as number | null,
      distressScore: Number(row.distress_score) || 0,
      distressUpdatedAt: (row.distress_updated_at as string) || null,
      activeLienCount: Number(row.active_lien_count) || 0,
      totalTaxOwed: Number(row.total_tax_owed) || 0,
      taxYearsWithLiens: Number(row.tax_years_with_liens) || 0,
      mostRecentLienDate: (row.most_recent_lien_date as string) || null,
    }));

    return {
      parks,
      count: parks.length,
      filters: {
        county: county || 'all',
        minScore,
        maxScore,
        minLots,
        maxLots,
      },
      sortBy,
      sortOrder,
    };
  },
});
