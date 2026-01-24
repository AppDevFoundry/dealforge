import { ApiErrors, createSuccessResponse } from '@/lib/api';
import { neon } from '@neondatabase/serverless';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

/**
 * Query params schema for distressed parks
 */
const DistressedParksQuerySchema = z.object({
  county: z.string().optional(),
  minScore: z.coerce.number().min(0).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
  sortBy: z.enum(['score', 'lienCount', 'taxOwed']).default('score'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

/**
 * GET /api/v1/mh-parks/distressed - Get distressed parks with filtering and pagination
 *
 * Query params:
 * - county: Filter by county name
 * - minScore: Minimum distress score (default: 20)
 * - page: Page number (default: 1)
 * - perPage: Items per page (default: 25, max: 100)
 * - sortBy: Sort field (score, lienCount, taxOwed)
 * - sortOrder: Sort order (asc, desc)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryResult = DistressedParksQuerySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryResult.success) {
      return ApiErrors.validationError(queryResult.error.errors);
    }

    const query = queryResult.data;
    const sql = getSql();
    const offset = (query.page - 1) * query.perPage;

    // Get total count first
    const countResult = query.county
      ? await sql`
          SELECT COUNT(*) as total
          FROM mh_communities c
          WHERE c.distress_score >= ${query.minScore}
            AND UPPER(c.county) = ${query.county.toUpperCase()}
        `
      : await sql`
          SELECT COUNT(*) as total
          FROM mh_communities c
          WHERE c.distress_score >= ${query.minScore}
        `;

    const total = Number(countResult[0]?.total) || 0;

    // Build base query parts - we need separate queries for each sort option
    // because Neon's tagged template doesn't support dynamic ORDER BY
    let rows: Record<string, unknown>[];

    if (query.county) {
      // With county filter
      if (query.sortBy === 'score') {
        rows =
          query.sortOrder === 'desc'
            ? await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore} AND UPPER(c.county) = ${query.county.toUpperCase()}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY c.distress_score DESC
            LIMIT ${query.perPage} OFFSET ${offset}
          `
            : await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore} AND UPPER(c.county) = ${query.county.toUpperCase()}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY c.distress_score ASC
            LIMIT ${query.perPage} OFFSET ${offset}
          `;
      } else if (query.sortBy === 'lienCount') {
        rows =
          query.sortOrder === 'desc'
            ? await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore} AND UPPER(c.county) = ${query.county.toUpperCase()}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY active_lien_count DESC
            LIMIT ${query.perPage} OFFSET ${offset}
          `
            : await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore} AND UPPER(c.county) = ${query.county.toUpperCase()}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY active_lien_count ASC
            LIMIT ${query.perPage} OFFSET ${offset}
          `;
      } else {
        // taxOwed
        rows =
          query.sortOrder === 'desc'
            ? await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore} AND UPPER(c.county) = ${query.county.toUpperCase()}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY total_tax_owed DESC
            LIMIT ${query.perPage} OFFSET ${offset}
          `
            : await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore} AND UPPER(c.county) = ${query.county.toUpperCase()}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY total_tax_owed ASC
            LIMIT ${query.perPage} OFFSET ${offset}
          `;
      }
    } else {
      // Without county filter
      if (query.sortBy === 'score') {
        rows =
          query.sortOrder === 'desc'
            ? await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY c.distress_score DESC
            LIMIT ${query.perPage} OFFSET ${offset}
          `
            : await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY c.distress_score ASC
            LIMIT ${query.perPage} OFFSET ${offset}
          `;
      } else if (query.sortBy === 'lienCount') {
        rows =
          query.sortOrder === 'desc'
            ? await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY active_lien_count DESC
            LIMIT ${query.perPage} OFFSET ${offset}
          `
            : await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY active_lien_count ASC
            LIMIT ${query.perPage} OFFSET ${offset}
          `;
      } else {
        // taxOwed
        rows =
          query.sortOrder === 'desc'
            ? await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY total_tax_owed DESC
            LIMIT ${query.perPage} OFFSET ${offset}
          `
            : await sql`
            SELECT c.id as community_id, c.name, c.address, c.city, c.county, c.lot_count,
                   c.latitude, c.longitude, c.distress_score, c.distress_updated_at,
                   COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
                   COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed,
                   COUNT(DISTINCT l.tax_year) FILTER (WHERE l.tax_year IS NOT NULL) as tax_years_with_liens,
                   MAX(l.lien_date) as most_recent_lien_date
            FROM mh_communities c
            LEFT JOIN mh_tax_liens l ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
                                    AND UPPER(l.payer_city) = UPPER(c.city)
            WHERE c.distress_score >= ${query.minScore}
            GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count, c.latitude, c.longitude, c.distress_score, c.distress_updated_at
            ORDER BY total_tax_owed ASC
            LIMIT ${query.perPage} OFFSET ${offset}
          `;
      }
    }

    const results = rows.map((row: Record<string, unknown>) => ({
      communityId: row.community_id as string,
      name: (row.name as string) || '',
      address: (row.address as string) || null,
      city: (row.city as string) || '',
      county: (row.county as string) || '',
      lotCount: (row.lot_count as number) || null,
      latitude: (row.latitude as number) || null,
      longitude: (row.longitude as number) || null,
      distressScore: Number(row.distress_score) || 0,
      distressUpdatedAt: row.distress_updated_at
        ? new Date(row.distress_updated_at as string).toISOString()
        : null,
      activeLienCount: Number(row.active_lien_count) || 0,
      totalTaxOwed: Number(row.total_tax_owed) || 0,
      taxYearsWithLiens: Number(row.tax_years_with_liens) || 0,
      mostRecentLienDate: (row.most_recent_lien_date as string) || null,
    }));

    return createSuccessResponse(results, {
      pagination: {
        page: query.page,
        perPage: query.perPage,
        total,
      },
    });
  } catch (error) {
    console.error('Error fetching distressed parks:', error);
    return ApiErrors.internalError('Failed to fetch distressed parks');
  }
}
