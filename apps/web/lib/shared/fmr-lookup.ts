/**
 * HUD Fair Market Rent (FMR) lookup utilities
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export interface FmrData {
  year: number;
  efficiency?: number | null;
  oneBr?: number | null;
  twoBr?: number | null;
  threeBr?: number | null;
  fourBr?: number | null;
  areaName?: string | null;
  countyName?: string | null;
}

/**
 * Look up Fair Market Rent data for a ZIP code
 */
export async function lookupFmr(zipCode: string): Promise<FmrData | null> {
  const sql = getSql();

  try {
    const fmrRows = (await sql`
      SELECT
        fiscal_year,
        efficiency,
        one_bedroom,
        two_bedroom,
        three_bedroom,
        four_bedroom,
        area_name,
        county_name
      FROM hud_fair_market_rents
      WHERE zip_code = ${zipCode}
      ORDER BY fiscal_year DESC
      LIMIT 1
    `) as Array<Record<string, unknown>>;

    const fmr = fmrRows[0];
    if (!fmr) {
      return null;
    }

    return {
      year: Number(fmr.fiscal_year),
      efficiency: fmr.efficiency ? Number(fmr.efficiency) : null,
      oneBr: fmr.one_bedroom ? Number(fmr.one_bedroom) : null,
      twoBr: fmr.two_bedroom ? Number(fmr.two_bedroom) : null,
      threeBr: fmr.three_bedroom ? Number(fmr.three_bedroom) : null,
      fourBr: fmr.four_bedroom ? Number(fmr.four_bedroom) : null,
      areaName: fmr.area_name as string | null,
      countyName: fmr.county_name as string | null,
    };
  } catch (error) {
    console.warn('FMR lookup failed:', error);
    return null;
  }
}

/**
 * Calculate suggested lot rent based on FMR data
 * Rule of thumb: lot rent is typically 30-40% of 2BR FMR
 */
export function calculateSuggestedLotRent(fmr: FmrData): { low: number; high: number } | null {
  if (!fmr.twoBr) {
    return null;
  }

  return {
    low: Math.round(fmr.twoBr * 0.3),
    high: Math.round(fmr.twoBr * 0.4),
  };
}
