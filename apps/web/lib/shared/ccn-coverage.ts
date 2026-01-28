/**
 * CCN (Certificate of Convenience and Necessity) utility coverage utilities
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export interface CcnCoverageResult {
  utilityName: string;
  ccnNumber?: string | null;
  serviceType: string;
  county?: string | null;
}

export interface UtilityCoverage {
  hasWater: boolean;
  hasSewer: boolean;
  waterProvider?: CcnCoverageResult | null;
  sewerProvider?: CcnCoverageResult | null;
}

/**
 * Check CCN utility coverage for a given location
 */
export async function checkCCNCoverage(
  latitude: number,
  longitude: number
): Promise<UtilityCoverage> {
  const result: UtilityCoverage = {
    hasWater: false,
    hasSewer: false,
  };

  const sql = getSql();

  try {
    // Check water coverage
    const waterCoverage = (await sql`
      SELECT utility_name, ccn_number, service_type, county
      FROM ccn_areas
      WHERE service_type IN ('water', 'both')
        AND ST_Contains(
          boundary::geometry,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        )
      LIMIT 1
    `) as Array<{
      utility_name: string;
      ccn_number: string | null;
      service_type: string;
      county: string | null;
    }>;

    if (waterCoverage.length > 0) {
      const coverage = waterCoverage[0]!;
      result.hasWater = true;
      result.waterProvider = {
        utilityName: coverage.utility_name,
        ccnNumber: coverage.ccn_number,
        serviceType: coverage.service_type,
        county: coverage.county,
      };
    }

    // Check sewer coverage
    const sewerCoverage = (await sql`
      SELECT utility_name, ccn_number, service_type, county
      FROM ccn_areas
      WHERE service_type IN ('sewer', 'both')
        AND ST_Contains(
          boundary::geometry,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
        )
      LIMIT 1
    `) as Array<{
      utility_name: string;
      ccn_number: string | null;
      service_type: string;
      county: string | null;
    }>;

    if (sewerCoverage.length > 0) {
      const coverage = sewerCoverage[0]!;
      result.hasSewer = true;
      result.sewerProvider = {
        utilityName: coverage.utility_name,
        ccnNumber: coverage.ccn_number,
        serviceType: coverage.service_type,
        county: coverage.county,
      };
    }
  } catch (error) {
    // PostGIS functions may not be available or CCN data not loaded
    console.warn('CCN coverage check failed:', error);
  }

  return result;
}
