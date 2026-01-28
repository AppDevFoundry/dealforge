/**
 * Census demographics lookup utilities
 */

import { neon } from '@neondatabase/serverless';

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(connectionString);
}

export interface Demographics {
  population?: number | null;
  medianHouseholdIncome?: number | null;
  medianAge?: number | null;
  povertyRate?: number | null;
  unemploymentRate?: number | null;
  housingUnits?: number | null;
  ownerOccupiedRate?: number | null;
  medianHomeValue?: number | null;
  dataYear?: number | null;
}

/**
 * Look up demographics data for a county
 */
export async function lookupDemographics(
  county: string,
  state = 'TX'
): Promise<Demographics | null> {
  const sql = getSql();

  try {
    // Normalize county name (remove "County" suffix if present)
    const normalizedCounty = county.replace(/ County$/i, '').trim();

    const rows = (await sql`
      SELECT
        data_year,
        total_population,
        median_household_income,
        median_age,
        poverty_rate,
        unemployment_rate,
        total_housing_units,
        owner_occupied_rate,
        median_home_value
      FROM census_demographics
      WHERE LOWER(county) = LOWER(${normalizedCounty})
        AND state = ${state}
      ORDER BY data_year DESC
      LIMIT 1
    `) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) {
      return null;
    }

    return {
      population: row.total_population ? Number(row.total_population) : null,
      medianHouseholdIncome: row.median_household_income
        ? Number(row.median_household_income)
        : null,
      medianAge: row.median_age ? Number(row.median_age) : null,
      povertyRate: row.poverty_rate ? Number(row.poverty_rate) : null,
      unemploymentRate: row.unemployment_rate ? Number(row.unemployment_rate) : null,
      housingUnits: row.total_housing_units ? Number(row.total_housing_units) : null,
      ownerOccupiedRate: row.owner_occupied_rate ? Number(row.owner_occupied_rate) : null,
      medianHomeValue: row.median_home_value ? Number(row.median_home_value) : null,
      dataYear: row.data_year ? Number(row.data_year) : null,
    };
  } catch (error) {
    console.warn('Demographics lookup failed:', error);
    return null;
  }
}
