/**
 * Get Market Context Tool
 *
 * Fetches comprehensive market intelligence including HUD Fair Market Rents,
 * Census demographics, and BLS employment data for a location.
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

const getMarketContextSchema = z.object({
  zipCode: z
    .string()
    .optional()
    .describe('ZIP code to get market data for. If provided, fetches ZIP-specific FMR data.'),
  county: z
    .string()
    .optional()
    .describe('Texas county name (e.g., "Bexar", "Harris"). Required if zipCode not provided.'),
  includeHistorical: z
    .boolean()
    .default(false)
    .describe('Include historical employment data (last 12 months) for trend analysis.'),
});

type GetMarketContextParams = z.infer<typeof getMarketContextSchema>;

export interface MarketContextResult {
  location: {
    zipCode?: string;
    county: string;
    metro?: string;
  };
  fairMarketRents?: {
    fiscalYear: number;
    efficiency: number | null;
    oneBedroom: number | null;
    twoBedroom: number | null;
    threeBedroom: number | null;
    fourBedroom: number | null;
    suggestedLotRent: {
      low: number;
      high: number;
      basis: string;
    };
  };
  demographics?: {
    surveyYear: number;
    population: number | null;
    medianAge: number | null;
    medianHouseholdIncome: number | null;
    povertyRate: number | null;
    totalHousingUnits: number | null;
    vacancyRate: number | null;
    medianHomeValue: number | null;
    medianGrossRent: number | null;
    mobileHomesCount: number | null;
    mobileHomesPercent: number | null;
  };
  employment?: {
    latestMonth: string;
    laborForce: number | null;
    employed: number | null;
    unemployed: number | null;
    unemploymentRate: number | null;
    historical?: Array<{
      month: string;
      unemploymentRate: number | null;
    }>;
  };
  insights: string[];
}

export const getMarketContext = tool({
  description:
    'Get comprehensive market intelligence for a Texas location including HUD Fair Market Rents, Census demographics, and BLS employment data. Use this to analyze market conditions for mobile home park investments.',
  inputSchema: getMarketContextSchema,
  execute: async (params: GetMarketContextParams): Promise<MarketContextResult> => {
    const { zipCode, county, includeHistorical } = params;
    const sql = getSql();

    if (!zipCode && !county) {
      throw new Error('Either zipCode or county must be provided');
    }

    const result: MarketContextResult = {
      location: {
        zipCode,
        county: county || '',
      },
      insights: [],
    };

    // Resolve county from ZIP code if needed
    let resolvedCounty = county?.toUpperCase();
    if (zipCode && !resolvedCounty) {
      const fmrRows = (await sql`
        SELECT county_name FROM hud_fair_market_rents
        WHERE zip_code = ${zipCode}
        ORDER BY fiscal_year DESC
        LIMIT 1
      `) as Array<{ county_name: string | null }>;
      const firstRow = fmrRows[0];
      if (firstRow?.county_name) {
        resolvedCounty = firstRow.county_name.toUpperCase();
        result.location.county = resolvedCounty;
      }
    }

    // Fetch HUD Fair Market Rents
    if (zipCode) {
      const fmrRows = (await sql`
        SELECT
          fiscal_year, efficiency, one_bedroom, two_bedroom,
          three_bedroom, four_bedroom, metro_name, county_name
        FROM hud_fair_market_rents
        WHERE zip_code = ${zipCode}
        ORDER BY fiscal_year DESC
        LIMIT 1
      `) as Array<Record<string, unknown>>;

      const fmr = fmrRows[0];
      if (fmr) {
        const twoBedroom = Number(fmr.two_bedroom) || 0;

        result.fairMarketRents = {
          fiscalYear: Number(fmr.fiscal_year),
          efficiency: fmr.efficiency ? Number(fmr.efficiency) : null,
          oneBedroom: fmr.one_bedroom ? Number(fmr.one_bedroom) : null,
          twoBedroom: fmr.two_bedroom ? Number(fmr.two_bedroom) : null,
          threeBedroom: fmr.three_bedroom ? Number(fmr.three_bedroom) : null,
          fourBedroom: fmr.four_bedroom ? Number(fmr.four_bedroom) : null,
          suggestedLotRent: {
            low: Math.round(twoBedroom * 0.30),
            high: Math.round(twoBedroom * 0.40),
            basis: 'Lot rent typically 30-40% of 2BR FMR',
          },
        };

        if (fmr.metro_name) {
          result.location.metro = fmr.metro_name as string;
        }
        if (fmr.county_name && !result.location.county) {
          result.location.county = fmr.county_name as string;
          resolvedCounty = (fmr.county_name as string).toUpperCase();
        }
      }
    }

    // Fetch Census Demographics by county
    if (resolvedCounty) {
      // Try to match county name in geo_name field
      const censusRows = (await sql`
        SELECT *
        FROM census_demographics
        WHERE geo_type = 'county'
          AND UPPER(geo_name) LIKE ${`%${resolvedCounty}%`}
          AND UPPER(geo_name) LIKE '%TEXAS%'
        ORDER BY survey_year DESC
        LIMIT 1
      `) as Array<Record<string, unknown>>;

      const census = censusRows[0];
      if (census) {
        result.demographics = {
          surveyYear: Number(census.survey_year),
          population: census.total_population ? Number(census.total_population) : null,
          medianAge: census.median_age ? Number(census.median_age) : null,
          medianHouseholdIncome: census.median_household_income
            ? Number(census.median_household_income)
            : null,
          povertyRate: census.poverty_rate ? Number(census.poverty_rate) : null,
          totalHousingUnits: census.total_housing_units
            ? Number(census.total_housing_units)
            : null,
          vacancyRate: census.vacancy_rate ? Number(census.vacancy_rate) : null,
          medianHomeValue: census.median_home_value ? Number(census.median_home_value) : null,
          medianGrossRent: census.median_gross_rent ? Number(census.median_gross_rent) : null,
          mobileHomesCount: census.mobile_homes_count ? Number(census.mobile_homes_count) : null,
          mobileHomesPercent: census.mobile_homes_percent
            ? Number(census.mobile_homes_percent)
            : null,
        };
      }
    }

    // Fetch BLS Employment data by county
    if (resolvedCounty) {
      const blsRows = (await sql`
        SELECT
          year, month, labor_force, employed, unemployed, unemployment_rate
        FROM bls_employment
        WHERE UPPER(area_name) LIKE ${`%${resolvedCounty}%`}
        ORDER BY year DESC, month DESC
        LIMIT ${includeHistorical ? 13 : 1}
      `) as Array<Record<string, unknown>>;

      const latest = blsRows[0];
      if (latest) {
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        ];

        result.employment = {
          latestMonth: `${monthNames[Number(latest.month) - 1]} ${latest.year}`,
          laborForce: latest.labor_force ? Number(latest.labor_force) : null,
          employed: latest.employed ? Number(latest.employed) : null,
          unemployed: latest.unemployed ? Number(latest.unemployed) : null,
          unemploymentRate: latest.unemployment_rate ? Number(latest.unemployment_rate) : null,
        };

        if (includeHistorical && blsRows.length > 1) {
          result.employment.historical = blsRows.slice(1).map((row) => ({
            month: `${monthNames[Number(row.month) - 1]} ${row.year}`,
            unemploymentRate: row.unemployment_rate ? Number(row.unemployment_rate) : null,
          }));
        }
      }
    }

    // Generate market insights
    result.insights = generateInsights(result);

    return result;
  },
});

function generateInsights(data: MarketContextResult): string[] {
  const insights: string[] = [];

  // FMR insights
  if (data.fairMarketRents) {
    const fmr = data.fairMarketRents;
    insights.push(
      `FY${fmr.fiscalYear} 2BR FMR is $${fmr.twoBedroom?.toLocaleString()}/month - suggested lot rent range: $${fmr.suggestedLotRent.low}-$${fmr.suggestedLotRent.high}/month`
    );
  }

  // Demographics insights
  if (data.demographics) {
    const demo = data.demographics;

    if (demo.medianHouseholdIncome) {
      const monthlyIncome = Math.round(demo.medianHouseholdIncome / 12);
      const affordableLotRent = Math.round(monthlyIncome * 0.25); // 25% of income
      insights.push(
        `Median household income $${demo.medianHouseholdIncome.toLocaleString()}/year supports lot rent up to ~$${affordableLotRent}/month (25% rule)`
      );
    }

    if (demo.mobileHomesPercent !== null && demo.mobileHomesPercent > 5) {
      insights.push(
        `Strong MH presence: ${demo.mobileHomesPercent.toFixed(1)}% of housing units are mobile homes (${demo.mobileHomesCount?.toLocaleString()} units)`
      );
    }

    if (demo.vacancyRate !== null) {
      if (demo.vacancyRate > 10) {
        insights.push(
          `High vacancy rate (${demo.vacancyRate.toFixed(1)}%) may indicate weak demand - verify local conditions`
        );
      } else if (demo.vacancyRate < 5) {
        insights.push(
          `Tight housing market with ${demo.vacancyRate.toFixed(1)}% vacancy - strong demand fundamentals`
        );
      }
    }

    if (demo.povertyRate !== null && demo.povertyRate > 15) {
      insights.push(
        `Elevated poverty rate (${demo.povertyRate.toFixed(1)}%) - affordable housing demand likely strong but consider resident payment capacity`
      );
    }
  }

  // Employment insights
  if (data.employment) {
    const emp = data.employment;

    if (emp.unemploymentRate !== null) {
      if (emp.unemploymentRate > 6) {
        insights.push(
          `Above-average unemployment (${emp.unemploymentRate.toFixed(1)}%) - factor into occupancy projections`
        );
      } else if (emp.unemploymentRate < 4) {
        insights.push(
          `Strong labor market with ${emp.unemploymentRate.toFixed(1)}% unemployment supports stable occupancy`
        );
      }
    }

    // Trend analysis if historical data available
    if (emp.historical && emp.historical.length >= 6) {
      const recentRates = [emp.unemploymentRate, ...emp.historical.slice(0, 5).map((h) => h.unemploymentRate)].filter(
        (r): r is number => r !== null
      );
      if (recentRates.length >= 3) {
        const avgRecent = recentRates.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
        const avgOlder = recentRates.slice(3).reduce((a, b) => a + b, 0) / Math.max(recentRates.length - 3, 1);
        if (avgRecent < avgOlder - 0.5) {
          insights.push('Employment trend improving - unemployment declining over past 6 months');
        } else if (avgRecent > avgOlder + 0.5) {
          insights.push('Employment trend weakening - unemployment rising over past 6 months');
        }
      }
    }
  }

  return insights;
}
