/**
 * Analyze Deal Tool
 *
 * Runs financial analysis on a potential MH park acquisition
 * using the existing calculator with key investment metrics.
 */

import { tool } from 'ai';
import { z } from 'zod';

import { calculateMhParkMetrics } from '@/lib/calculations/mh-park';
import {
  MH_PARK_CAP_RATE_BENCHMARKS,
  MH_PARK_DEFAULTS,
  MH_PARK_DSCR_THRESHOLDS,
} from '@/lib/constants/mh-park-defaults';

const analyzeDealSchema = z.object({
  parkId: z
    .string()
    .optional()
    .describe('Optional park ID to associate analysis with a specific property'),
  purchasePrice: z.number().positive().describe('Purchase price in dollars (e.g., 2500000)'),
  lotCount: z.number().int().positive().describe('Total number of lots in the park'),
  occupiedLots: z.number().int().min(0).describe('Number of currently occupied lots'),
  avgLotRent: z.number().positive().describe('Average monthly lot rent in dollars (e.g., 450)'),
  downPaymentPercent: z
    .number()
    .min(0)
    .max(100)
    .default(25)
    .describe('Down payment as percentage of purchase price (default: 25%)'),
  interestRate: z
    .number()
    .min(0)
    .max(20)
    .default(7.0)
    .describe('Annual interest rate as percentage (default: 7.0%)'),
  loanTermYears: z
    .number()
    .int()
    .min(1)
    .max(30)
    .default(20)
    .describe('Loan term in years (default: 20)'),
  expenseRatioPercent: z
    .number()
    .min(0)
    .max(100)
    .default(35)
    .describe('Operating expense ratio as percentage of EGI (default: 35%)'),
  otherIncomeMonthly: z
    .number()
    .min(0)
    .default(0)
    .describe('Other monthly income like laundry, late fees (default: 0)'),
  marketCapRate: z
    .number()
    .min(0)
    .max(20)
    .default(8.0)
    .describe('Market cap rate for valuation comparison (default: 8.0%)'),
});

type AnalyzeDealParams = z.infer<typeof analyzeDealSchema>;

export const analyzeDeal = tool({
  description:
    'Run financial analysis on a potential mobile home park acquisition. Calculates key metrics like cap rate, cash-on-cash return, NOI, and DSCR. Provide deal parameters or use defaults for missing values.',
  inputSchema: analyzeDealSchema,
  execute: async (params: AnalyzeDealParams, _options) => {
    const {
      parkId,
      purchasePrice,
      lotCount,
      occupiedLots,
      avgLotRent,
      downPaymentPercent,
      interestRate,
      loanTermYears,
      expenseRatioPercent,
      otherIncomeMonthly,
      marketCapRate,
    } = params;

    // Validate occupancy
    if (occupiedLots > lotCount) {
      return {
        success: false,
        error: 'Occupied lots cannot exceed total lot count',
      };
    }

    // Build calculator inputs
    const inputs = {
      lotCount,
      occupiedLots,
      avgLotRent,
      purchasePrice,
      downPaymentPercent,
      interestRate,
      loanTermYears,
      closingCostsPercent: MH_PARK_DEFAULTS.closingCostsPercent,
      expenseRatioPercent,
      otherIncomeMonthly,
      marketCapRate,
    };

    // Run calculation
    const results = calculateMhParkMetrics(inputs);

    // Assess deal quality
    const dscrRating = getDscrRating(results.debtServiceCoverageRatio);
    const capRateAssessment = getCapRateAssessment(results.capRate);
    const cashOnCashAssessment = getCashOnCashAssessment(results.cashOnCashReturn);

    // Calculate price per lot
    const pricePerLot = results.pricePerLot;
    const pricePerLotAssessment = getPricePerLotAssessment(pricePerLot);

    // Value comparison
    const valueVsPurchase = results.estimatedMarketValue - purchasePrice;
    const valueVsPurchasePercent = purchasePrice > 0 ? (valueVsPurchase / purchasePrice) * 100 : 0;

    return {
      success: true,
      parkId: parkId || null,
      inputs: {
        purchasePrice,
        lotCount,
        occupiedLots,
        avgLotRent,
        downPaymentPercent,
        interestRate,
        loanTermYears,
        expenseRatioPercent,
        otherIncomeMonthly,
        marketCapRate,
      },
      results: {
        // Income Analysis
        grossPotentialRent: results.grossPotentialRent,
        effectiveGrossIncome: results.effectiveGrossIncome,
        vacancyLoss: results.vacancyLoss,
        occupancyRate: results.occupancyRate,

        // Expenses
        totalOperatingExpenses: results.totalOperatingExpenses,

        // NOI
        netOperatingIncome: results.netOperatingIncome,
        noiPerLot: results.noiPerLot,

        // Financing
        loanAmount: results.loanAmount,
        downPayment: results.downPayment,
        totalInvestment: results.totalInvestment,
        monthlyDebtService: results.monthlyDebtService,
        annualDebtService: results.annualDebtService,

        // Key Metrics
        capRate: results.capRate,
        cashOnCashReturn: results.cashOnCashReturn,
        debtServiceCoverageRatio: results.debtServiceCoverageRatio,

        // Cash Flow
        monthlyCashFlow: results.monthlyCashFlow,
        annualCashFlow: results.annualCashFlow,

        // Valuation
        pricePerLot: results.pricePerLot,
        grossRentMultiplier: results.grossRentMultiplier,
        estimatedMarketValue: results.estimatedMarketValue,
      },
      assessment: {
        dscrRating,
        dscrThresholds: MH_PARK_DSCR_THRESHOLDS,
        capRateAssessment,
        capRateBenchmarks: MH_PARK_CAP_RATE_BENCHMARKS,
        cashOnCashAssessment,
        pricePerLotAssessment,
        valueComparison: {
          estimatedValue: results.estimatedMarketValue,
          purchasePrice,
          difference: valueVsPurchase,
          differencePercent: valueVsPurchasePercent,
          assessment:
            valueVsPurchase > 0
              ? 'Potential upside - property may be undervalued'
              : valueVsPurchase < 0
                ? 'Premium pricing - paying above estimated market value'
                : 'Fair market value',
        },
        overallRating: getOverallRating(
          results.debtServiceCoverageRatio,
          results.cashOnCashReturn,
          results.capRate,
          valueVsPurchasePercent
        ),
      },
    };
  },
});

function getDscrRating(dscr: number): string {
  if (dscr >= MH_PARK_DSCR_THRESHOLDS.excellent) return 'excellent';
  if (dscr >= MH_PARK_DSCR_THRESHOLDS.good) return 'good';
  if (dscr >= MH_PARK_DSCR_THRESHOLDS.acceptable) return 'acceptable';
  if (dscr >= MH_PARK_DSCR_THRESHOLDS.risky) return 'risky';
  return 'negative_cashflow';
}

function getCapRateAssessment(capRate: number): string {
  if (capRate >= 10) return 'High cap rate - potentially higher risk or rural market';
  if (capRate >= 8) return 'Typical secondary market cap rate';
  if (capRate >= 6) return 'Primary market cap rate - lower yield but potentially lower risk';
  if (capRate >= 4) return 'Low cap rate - may be overpriced or premium location';
  return 'Very low cap rate - verify assumptions';
}

function getCashOnCashAssessment(coc: number): string {
  if (coc >= 15) return 'Excellent cash-on-cash return';
  if (coc >= 10) return 'Good cash-on-cash return';
  if (coc >= 6) return 'Acceptable cash-on-cash return';
  if (coc >= 0) return 'Low but positive return';
  return 'Negative cash flow';
}

function getPricePerLotAssessment(ppl: number): string {
  if (ppl >= 50000) return 'Premium pricing - verify value drivers';
  if (ppl >= 35000) return 'Above average for Texas market';
  if (ppl >= 20000) return 'Typical Texas market pricing';
  if (ppl >= 10000) return 'Below market - investigate condition/location';
  return 'Very low - significant due diligence needed';
}

function getOverallRating(
  dscr: number,
  coc: number,
  capRate: number,
  valueUpside: number
): 'strong_buy' | 'buy' | 'hold' | 'caution' | 'avoid' {
  let score = 0;

  // DSCR scoring (0-30 points)
  if (dscr >= 1.5) score += 30;
  else if (dscr >= 1.25) score += 20;
  else if (dscr >= 1.15) score += 10;
  else if (dscr >= 1.0) score += 5;

  // Cash-on-cash scoring (0-30 points)
  if (coc >= 15) score += 30;
  else if (coc >= 10) score += 20;
  else if (coc >= 6) score += 10;
  else if (coc >= 0) score += 5;

  // Cap rate scoring (0-20 points)
  if (capRate >= 8 && capRate <= 12) score += 20;
  else if (capRate >= 6 && capRate < 8) score += 15;
  else if (capRate > 12) score += 10;
  else score += 5;

  // Value upside scoring (0-20 points)
  if (valueUpside >= 15) score += 20;
  else if (valueUpside >= 5) score += 15;
  else if (valueUpside >= 0) score += 10;
  else if (valueUpside >= -10) score += 5;

  // Map score to rating
  if (score >= 80) return 'strong_buy';
  if (score >= 60) return 'buy';
  if (score >= 40) return 'hold';
  if (score >= 20) return 'caution';
  return 'avoid';
}
