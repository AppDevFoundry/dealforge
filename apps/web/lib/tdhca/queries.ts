/**
 * TDHCA park lien and title activity queries
 *
 * Read-only queries joining mh_communities with mh_ownership_records
 * and mh_tax_liens via address matching for park-level analytics.
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export interface TaxLienSummary {
  communityId: string;
  totalLiens: number;
  activeLiens: number;
  releasedLiens: number;
  totalTaxAmount: number;
  avgTaxAmount: number;
  mostRecentLienDate: string | null;
  taxYearsSpanned: number[];
}

export interface TitleActivity {
  certificateNumber: string;
  ownerName: string;
  saleDate: string;
  sellerName: string;
  electionType: string;
  issueDate: string;
}

export interface DistressedPark {
  communityId: string;
  name: string;
  address: string;
  city: string;
  county: string;
  lotCount: number | null;
  activeLienCount: number;
  totalTaxOwed: number;
}

/**
 * Get tax lien summary for a community by matching install address and city
 */
export async function getTaxLienSummaryForPark(
  communityId: string
): Promise<TaxLienSummary | null> {
  const sql = getSql();

  // First get the community's address info
  const communityRows = await sql`
    SELECT id, address, city, county
    FROM mh_communities
    WHERE id = ${communityId}
    LIMIT 1
  `;

  if (communityRows.length === 0) return null;

  const community = communityRows[0]!;
  const address = (community.address as string) || '';
  const city = (community.city as string) || '';

  // Match liens by payer address and city (tax liens use payer address)
  const lienRows = await sql`
    SELECT
      COUNT(*) as total_liens,
      COUNT(*) FILTER (WHERE status = 'active') as active_liens,
      COUNT(*) FILTER (WHERE status = 'released') as released_liens,
      COALESCE(SUM(tax_amount), 0) as total_tax_amount,
      COALESCE(AVG(tax_amount), 0) as avg_tax_amount,
      MAX(lien_date) as most_recent_lien_date,
      ARRAY_AGG(DISTINCT tax_year ORDER BY tax_year) FILTER (WHERE tax_year IS NOT NULL) as tax_years
    FROM mh_tax_liens
    WHERE UPPER(payer_address) LIKE ${`%${address.toUpperCase().substring(0, 20)}%`}
      AND UPPER(payer_city) = ${city.toUpperCase()}
  `;

  if (lienRows.length === 0) return null;

  const row = lienRows[0]!;
  return {
    communityId,
    totalLiens: Number(row.total_liens) || 0,
    activeLiens: Number(row.active_liens) || 0,
    releasedLiens: Number(row.released_liens) || 0,
    totalTaxAmount: Number(row.total_tax_amount) || 0,
    avgTaxAmount: Number(row.avg_tax_amount) || 0,
    mostRecentLienDate: (row.most_recent_lien_date as string) || null,
    taxYearsSpanned: (row.tax_years as number[]) || [],
  };
}

/**
 * Get recent title activity for a community's install address
 */
export async function getTitleActivityForPark(
  communityId: string,
  limit = 20
): Promise<TitleActivity[]> {
  const sql = getSql();

  const communityRows = await sql`
    SELECT address, city, county
    FROM mh_communities
    WHERE id = ${communityId}
    LIMIT 1
  `;

  if (communityRows.length === 0) return [];

  const community = communityRows[0]!;
  const address = (community.address as string) || '';
  const city = (community.city as string) || '';

  const rows = await sql`
    SELECT certificate_number, owner_name, sale_date, seller_name,
           election_type, issue_date
    FROM mh_ownership_records
    WHERE UPPER(install_address) LIKE ${`%${address.toUpperCase().substring(0, 20)}%`}
      AND UPPER(install_city) = ${city.toUpperCase()}
    ORDER BY issue_date DESC
    LIMIT ${limit}
  `;

  return rows.map((row: Record<string, unknown>) => ({
    certificateNumber: (row.certificate_number as string) || '',
    ownerName: (row.owner_name as string) || '',
    saleDate: (row.sale_date as string) || '',
    sellerName: (row.seller_name as string) || '',
    electionType: (row.election_type as string) || '',
    issueDate: (row.issue_date as string) || '',
  }));
}

/**
 * Get parks ranked by lien concentration (distress indicator)
 */
export async function getDistressedParks(county?: string, limit = 25): Promise<DistressedPark[]> {
  const sql = getSql();

  const rows = county
    ? await sql`
        SELECT
          c.id as community_id,
          c.name,
          c.address,
          c.city,
          c.county,
          c.lot_count,
          COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
          COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed
        FROM mh_communities c
        LEFT JOIN mh_tax_liens l
          ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
          AND UPPER(l.payer_city) = UPPER(c.city)
        WHERE UPPER(c.county) = ${county.toUpperCase()}
        GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count
        HAVING COUNT(l.id) FILTER (WHERE l.status = 'active') > 0
        ORDER BY active_lien_count DESC
        LIMIT ${limit}
      `
    : await sql`
        SELECT
          c.id as community_id,
          c.name,
          c.address,
          c.city,
          c.county,
          c.lot_count,
          COUNT(l.id) FILTER (WHERE l.status = 'active') as active_lien_count,
          COALESCE(SUM(l.tax_amount) FILTER (WHERE l.status = 'active'), 0) as total_tax_owed
        FROM mh_communities c
        LEFT JOIN mh_tax_liens l
          ON UPPER(l.payer_address) LIKE '%' || UPPER(LEFT(c.address, 20)) || '%'
          AND UPPER(l.payer_city) = UPPER(c.city)
        GROUP BY c.id, c.name, c.address, c.city, c.county, c.lot_count
        HAVING COUNT(l.id) FILTER (WHERE l.status = 'active') > 0
        ORDER BY active_lien_count DESC
        LIMIT ${limit}
      `;

  return rows.map((row: Record<string, unknown>) => ({
    communityId: row.community_id as string,
    name: (row.name as string) || '',
    address: (row.address as string) || '',
    city: (row.city as string) || '',
    county: (row.county as string) || '',
    lotCount: row.lot_count as number | null,
    activeLienCount: Number(row.active_lien_count) || 0,
    totalTaxOwed: Number(row.total_tax_owed) || 0,
  }));
}
