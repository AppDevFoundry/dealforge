import type { SyndicationInputs, SyndicationResults } from '@dealforge/types';

/**
 * Default values for the syndication calculator
 * Assumes a typical multi-family syndication deal
 */
export const SYNDICATION_DEFAULTS: SyndicationInputs = {
  // Project Capitalization
  purchasePrice: 5000000,
  closingCosts: 100000,
  capexReserves: 150000,
  totalCapitalization: 0, // Will be calculated

  // Equity Structure
  lpEquityPercent: 90,
  gpEquityPercent: 10,

  // Debt
  loanToValue: 65,
  interestRate: 6.5,
  loanTermYears: 10,
  amortizationYears: 30,
  interestOnly: true,
  interestOnlyYears: 3,

  // Fees
  acquisitionFeePercent: 2,
  assetManagementFeePercent: 2,

  // Preferred Return
  preferredReturn: 8,

  // Waterfall Tiers
  tier1LpSplit: 70,
  tier1GpSplit: 30,
  tier2IrrHurdle: 12,
  tier2LpSplit: 60,
  tier2GpSplit: 40,
  tier3IrrHurdle: 18,
  tier3LpSplit: 50,
  tier3GpSplit: 50,

  // Property Operations (Year 1)
  grossPotentialRent: 600000,
  vacancyRate: 5,
  otherIncome: 24000,
  operatingExpenseRatio: 45,

  // Growth Assumptions
  rentGrowthRate: 3,
  expenseGrowthRate: 2,
  holdPeriodYears: 5,

  // Exit Assumptions
  exitCapRate: 6.0,
  dispositionFeePercent: 2,
};

/**
 * Explanations for each result metric (shown in Learn Mode)
 */
export const SYNDICATION_METRIC_EXPLANATIONS: Record<
  keyof Omit<SyndicationResults, 'yearlyProjections' | 'sensitivityAnalysis'>,
  string
> = {
  // Capitalization Summary
  totalEquity:
    'Total equity contributed by all investors (LP + GP). Formula: Total Capitalization - Loan Amount.',
  lpEquity:
    'Limited Partner equity contribution. LPs are passive investors who provide most of the capital but have limited liability.',
  gpEquity:
    'General Partner equity contribution. GPs manage the deal and typically contribute 5-20% of total equity.',
  loanAmount:
    'Debt financing based on the Loan-to-Value ratio. Formula: Purchase Price × LTV%. Higher leverage amplifies returns but increases risk.',
  totalCapitalization:
    'Total capital needed for the project. Formula: Purchase Price + Closing Costs + CapEx Reserves.',

  // Fee Summary
  acquisitionFee:
    'One-time fee paid to the GP at closing for sourcing and executing the deal. Formula: Purchase Price × Acquisition Fee %. Typically 1-3%.',
  totalAssetManagementFees:
    'Ongoing fees paid to GP for managing the property over the hold period. Formula: Total Equity × Annual Asset Mgmt Fee % × Hold Years.',

  // Operating Projections
  totalNoiOverHold:
    'Sum of Net Operating Income across all years of the hold period. Indicates total operational profit before debt service.',

  // Exit Analysis
  exitNoi:
    'Projected Net Operating Income at exit, used for valuation. Typically projected one year forward from the final operating year.',
  exitValue:
    'Estimated sale price based on exit cap rate. Formula: Exit NOI / Exit Cap Rate. Lower cap rates = higher values.',
  dispositionCosts:
    'Selling costs including broker commissions, transfer taxes, and legal fees. Formula: Exit Value × Disposition Fee %.',
  netSaleProceeds:
    'Cash available after sale. Formula: Exit Value - Disposition Costs - Loan Payoff. This is distributed through the waterfall.',
  loanPayoff:
    'Remaining loan balance at exit. Depends on amortization schedule and interest-only period.',
  equityAtSale:
    'Property equity at sale. Formula: Exit Value - Loan Payoff. Not the same as distributable cash (which deducts selling costs).',

  // LP Returns
  lpTotalDistributions:
    'Total cash returned to Limited Partners including operating distributions and sale proceeds.',
  lpEquityMultiple:
    'Total distributions divided by initial investment. Formula: LP Total Distributions / LP Equity. A 2.0x multiple means LPs doubled their money.',
  lpIrr:
    'Internal Rate of Return for LPs. Measures the annualized return accounting for timing of cash flows. 15-20% is typically considered good for syndications.',
  lpPreferredReturnTotal:
    'Cumulative preferred return paid to LPs. LPs receive this return before GP earns any promote.',
  lpCashFlowDistributions:
    'Operating cash flow distributions to LPs during the hold period (before exit).',
  lpSaleProceedsDistribution:
    'LP share of sale proceeds distributed through the waterfall at exit.',

  // GP Returns
  gpTotalDistributions:
    'Total cash received by General Partners including equity return, fees, and promote.',
  gpEquityMultiple:
    'Total distributions divided by GP equity contribution. Often much higher than LP multiple due to promote.',
  gpIrr:
    'Internal Rate of Return for GPs. Typically higher than LP IRR due to promote structure and fees.',
  gpAcquisitionFee: 'One-time acquisition fee earned by GP at closing.',
  gpAssetManagementFees: 'Total asset management fees earned over the hold period.',
  gpPromote:
    'Carried interest or "promote" - the GP\'s share of profits above their pro-rata equity stake. The incentive for GPs to maximize returns.',
  gpCashFlowDistributions: 'GP share of operating cash flow distributions (excluding fees).',
  gpSaleProceedsDistribution:
    'GP share of sale proceeds distributed through the waterfall at exit.',

  // Deal Metrics
  goingInCapRate:
    'Cap rate at purchase. Formula: Year 1 NOI / Purchase Price × 100. Compare to exit cap rate to assess appreciation assumptions.',
  averageCashOnCash:
    'Average annual cash flow as a percentage of total equity. Formula: (Total Cash Flow / Hold Years) / Total Equity × 100.',
  totalProfitOverHold:
    'Total profit generated by the deal. Formula: Total Distributions - Total Equity. The value created for all investors.',
};

/**
 * Common preferred return rates
 */
export const PREFERRED_RETURN_OPTIONS = [
  { value: 6, label: '6% (Conservative)' },
  { value: 7, label: '7% (Low)' },
  { value: 8, label: '8% (Standard)' },
  { value: 10, label: '10% (High)' },
] as const;

/**
 * Common waterfall structures
 */
export const WATERFALL_PRESETS = {
  conservative: {
    name: 'Conservative (LP Favorable)',
    tier1LpSplit: 80,
    tier1GpSplit: 20,
    tier2IrrHurdle: 15,
    tier2LpSplit: 70,
    tier2GpSplit: 30,
    tier3IrrHurdle: 20,
    tier3LpSplit: 60,
    tier3GpSplit: 40,
  },
  standard: {
    name: 'Standard',
    tier1LpSplit: 70,
    tier1GpSplit: 30,
    tier2IrrHurdle: 12,
    tier2LpSplit: 60,
    tier2GpSplit: 40,
    tier3IrrHurdle: 18,
    tier3LpSplit: 50,
    tier3GpSplit: 50,
  },
  aggressive: {
    name: 'Aggressive (GP Favorable)',
    tier1LpSplit: 60,
    tier1GpSplit: 40,
    tier2IrrHurdle: 10,
    tier2LpSplit: 50,
    tier2GpSplit: 50,
    tier3IrrHurdle: 15,
    tier3LpSplit: 40,
    tier3GpSplit: 60,
  },
} as const;

/**
 * IRR benchmarks for syndications
 */
export const IRR_BENCHMARKS = {
  poor: 8,
  acceptable: 12,
  good: 15,
  excellent: 20,
} as const;

/**
 * Equity multiple benchmarks
 */
export const EQUITY_MULTIPLE_BENCHMARKS = {
  poor: 1.5,
  acceptable: 1.75,
  good: 2.0,
  excellent: 2.5,
} as const;
