/**
 * Get Park Lien History Tool
 *
 * Retrieves detailed tax lien history for a specific park
 * with yearly breakdown and individual lien records.
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

const getParkLienHistorySchema = z.object({
  parkId: z.string().describe('The unique community ID of the park'),
  includeReleased: z
    .boolean()
    .default(true)
    .describe('Whether to include released (resolved) liens in the results'),
});

type GetParkLienHistoryParams = z.infer<typeof getParkLienHistorySchema>;

export const getParkLienHistory = tool({
  description:
    'Get detailed tax lien history for a specific mobile home park, including individual lien records and yearly summaries.',
  inputSchema: getParkLienHistorySchema,
  execute: async (params: GetParkLienHistoryParams, _options) => {
    const { parkId, includeReleased } = params;
    const sql = getSql();

    // Get park address info for matching
    const parkRows = await sql`
      SELECT id, name, address, city, county
      FROM mh_communities
      WHERE id = ${parkId}
      LIMIT 1
    `;

    if (parkRows.length === 0) {
      return {
        found: false,
        error: `Park with ID "${parkId}" not found`,
      };
    }

    const park = parkRows[0]!;
    const address = (park.address as string) || '';
    const city = (park.city as string) || '';

    // Get all lien records
    const lienRows = await sql`
      SELECT
        id,
        certificate_number,
        tax_year,
        tax_amount,
        lien_date,
        status,
        release_date,
        payer_name,
        created_at
      FROM mh_tax_liens
      WHERE UPPER(payer_address) LIKE ${`%${address.toUpperCase().substring(0, 20)}%`}
        AND UPPER(payer_city) = ${city.toUpperCase()}
        ${includeReleased ? sql`` : sql`AND status = 'active'`}
      ORDER BY tax_year DESC, lien_date DESC
    `;

    // Group liens by year
    const liensByYear: Record<
      number,
      {
        year: number;
        totalAmount: number;
        activeLiens: number;
        releasedLiens: number;
        liens: Array<{
          id: string;
          certificateNumber: string | null;
          taxAmount: number;
          lienDate: string | null;
          status: string;
          releaseDate: string | null;
          payerName: string | null;
        }>;
      }
    > = {};

    for (const row of lienRows) {
      const year = row.tax_year as number;
      if (!year) continue;

      if (!liensByYear[year]) {
        liensByYear[year] = {
          year,
          totalAmount: 0,
          activeLiens: 0,
          releasedLiens: 0,
          liens: [],
        };
      }

      const amount = Number(row.tax_amount) || 0;
      liensByYear[year]!.totalAmount += amount;

      if (row.status === 'active') {
        liensByYear[year]!.activeLiens++;
      } else {
        liensByYear[year]!.releasedLiens++;
      }

      liensByYear[year]!.liens.push({
        id: row.id as string,
        certificateNumber: (row.certificate_number as string) || null,
        taxAmount: amount,
        lienDate: (row.lien_date as string) || null,
        status: (row.status as string) || 'unknown',
        releaseDate: (row.release_date as string) || null,
        payerName: (row.payer_name as string) || null,
      });
    }

    // Convert to sorted array
    const yearlyBreakdown = Object.values(liensByYear).sort((a, b) => b.year - a.year);

    // Calculate summary stats
    const totalLiens = lienRows.length;
    const activeLiens = lienRows.filter((r) => r.status === 'active').length;
    const releasedLiens = totalLiens - activeLiens;
    const totalAmount = lienRows.reduce((sum, r) => sum + (Number(r.tax_amount) || 0), 0);
    const activeAmount = lienRows
      .filter((r) => r.status === 'active')
      .reduce((sum, r) => sum + (Number(r.tax_amount) || 0), 0);

    // Find patterns
    const years = yearlyBreakdown.map((y) => y.year);
    const oldestYear = years.length > 0 ? Math.min(...years) : null;
    const newestYear = years.length > 0 ? Math.max(...years) : null;

    return {
      found: true,
      park: {
        id: park.id,
        name: park.name,
        address: park.address,
        city: park.city,
        county: park.county,
      },
      summary: {
        totalLiens,
        activeLiens,
        releasedLiens,
        totalAmount,
        activeAmount,
        yearsSpanned: years.length,
        oldestYear,
        newestYear,
      },
      yearlyBreakdown,
      patterns: {
        hasMultipleYears: years.length > 1,
        hasRecentActivity: newestYear !== null && newestYear >= new Date().getFullYear() - 1,
        hasOldUnresolvedDebt: oldestYear !== null && oldestYear < new Date().getFullYear() - 2,
        averageAnnualLiens: years.length > 0 ? totalLiens / years.length : 0,
      },
    };
  },
});
