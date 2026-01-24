/**
 * Get Park Details Tool
 *
 * Retrieves comprehensive details about a specific park including
 * basic info, lien summary, and infrastructure data.
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

const getParkDetailsSchema = z.object({
  parkId: z.string().describe('The unique community ID of the park'),
  includeInfrastructure: z
    .boolean()
    .default(false)
    .describe('Whether to include infrastructure details like utilities and amenities'),
});

type GetParkDetailsParams = z.infer<typeof getParkDetailsSchema>;

export const getParkDetails = tool({
  description:
    'Get comprehensive details about a specific mobile home park including basic information, tax lien summary, and optional infrastructure data.',
  inputSchema: getParkDetailsSchema,
  execute: async (params: GetParkDetailsParams, _options) => {
    const { parkId, includeInfrastructure } = params;
    const sql = getSql();

    // Get basic park info
    const parkRows = await sql`
      SELECT
        id,
        name,
        address,
        city,
        county,
        state,
        zip_code,
        latitude,
        longitude,
        lot_count,
        estimated_occupancy,
        property_type,
        owner_name,
        source,
        source_updated_at,
        distress_score,
        distress_updated_at,
        metadata,
        created_at,
        updated_at
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

    // Get lien summary
    const address = (park.address as string) || '';
    const city = (park.city as string) || '';

    const lienRows = await sql`
      SELECT
        COUNT(*) as total_liens,
        COUNT(*) FILTER (WHERE status = 'active') as active_liens,
        COUNT(*) FILTER (WHERE status = 'released') as released_liens,
        COALESCE(SUM(tax_amount), 0) as total_tax_amount,
        COALESCE(SUM(tax_amount) FILTER (WHERE status = 'active'), 0) as active_tax_amount,
        COALESCE(AVG(tax_amount), 0) as avg_tax_amount,
        MAX(lien_date) as most_recent_lien_date,
        MIN(tax_year) as earliest_tax_year,
        MAX(tax_year) as latest_tax_year,
        ARRAY_AGG(DISTINCT tax_year ORDER BY tax_year) FILTER (WHERE tax_year IS NOT NULL) as tax_years
      FROM mh_tax_liens
      WHERE UPPER(payer_address) LIKE ${`%${address.toUpperCase().substring(0, 20)}%`}
        AND UPPER(payer_city) = ${city.toUpperCase()}
    `;

    const lienData = lienRows[0];

    // Calculate distress indicators
    const activeLiens = Number(lienData?.active_liens) || 0;
    const lotCount = park.lot_count as number | null;
    const liensPerLot = lotCount && lotCount > 0 ? activeLiens / lotCount : null;
    const taxYears = (lienData?.tax_years as number[]) || [];
    const consecutiveYears = calculateConsecutiveYears(taxYears);

    // Build the response
    const response: Record<string, unknown> = {
      found: true,
      park: {
        id: park.id,
        name: park.name || 'Unknown',
        address: park.address,
        city: park.city,
        county: park.county,
        state: park.state || 'TX',
        zipCode: park.zip_code,
        latitude: park.latitude,
        longitude: park.longitude,
        lotCount: park.lot_count,
        estimatedOccupancy: park.estimated_occupancy,
        propertyType: park.property_type,
        ownerName: park.owner_name,
        distressScore: park.distress_score,
        distressUpdatedAt: park.distress_updated_at,
        sourceUpdatedAt: park.source_updated_at,
      },
      lienSummary: {
        totalLiens: Number(lienData?.total_liens) || 0,
        activeLiens,
        releasedLiens: Number(lienData?.released_liens) || 0,
        totalTaxAmount: Number(lienData?.total_tax_amount) || 0,
        activeTaxAmount: Number(lienData?.active_tax_amount) || 0,
        avgTaxAmount: Number(lienData?.avg_tax_amount) || 0,
        mostRecentLienDate: lienData?.most_recent_lien_date || null,
        earliestTaxYear: lienData?.earliest_tax_year || null,
        latestTaxYear: lienData?.latest_tax_year || null,
        taxYearsWithLiens: taxYears,
      },
      distressIndicators: {
        liensPerLot,
        consecutiveYearsWithLiens: consecutiveYears,
        hasRecentActivity:
          lienData?.most_recent_lien_date &&
          new Date(lienData.most_recent_lien_date as string) >
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        riskLevel: calculateRiskLevel(activeLiens, consecutiveYears, liensPerLot),
      },
    };

    // Add infrastructure data if requested
    if (includeInfrastructure) {
      const infraRows = await sql`
        SELECT
          water_source,
          sewer_type,
          utilities_included,
          amenities,
          road_condition,
          flood_zone
        FROM mh_community_infrastructure
        WHERE community_id = ${parkId}
        LIMIT 1
      `;

      if (infraRows.length > 0) {
        response.infrastructure = infraRows[0];
      } else {
        response.infrastructure = null;
      }
    }

    return response;
  },
});

/**
 * Calculate the longest streak of consecutive years with liens
 */
function calculateConsecutiveYears(years: number[]): number {
  if (years.length === 0) return 0;

  const sortedYears = [...years].sort((a, b) => a - b);
  let maxConsecutive = 1;
  let currentConsecutive = 1;

  for (let i = 1; i < sortedYears.length; i++) {
    if (sortedYears[i] === sortedYears[i - 1]! + 1) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 1;
    }
  }

  return maxConsecutive;
}

/**
 * Calculate risk level based on distress indicators
 */
function calculateRiskLevel(
  activeLiens: number,
  consecutiveYears: number,
  liensPerLot: number | null
): 'high' | 'medium' | 'low' {
  // High risk: Many active liens OR multiple consecutive years OR high concentration
  if (activeLiens >= 10 || consecutiveYears >= 3 || (liensPerLot !== null && liensPerLot >= 0.5)) {
    return 'high';
  }

  // Medium risk: Some liens or some consecutive years
  if (activeLiens >= 3 || consecutiveYears >= 2 || (liensPerLot !== null && liensPerLot >= 0.2)) {
    return 'medium';
  }

  return 'low';
}
