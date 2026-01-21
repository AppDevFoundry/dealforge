import type { MhParkCalculatorInputs, MhParkCalculatorResults } from '@dealforge/types';

/**
 * Default values for the MH Park calculator
 * Assumes a 75-lot mobile home park
 */
export const MH_PARK_DEFAULTS: MhParkCalculatorInputs = {
  // Property Info
  lotCount: 75,
  occupiedLots: 68, // ~90% occupancy
  avgLotRent: 450, // Average lot rent in Texas
  purchasePrice: 2500000,

  // Financing
  downPaymentPercent: 25,
  interestRate: 7.0,
  loanTermYears: 20, // Commercial typically 15-25 years
  closingCostsPercent: 2,

  // Income & Expenses
  expenseRatioPercent: 35, // MH parks typically 30-40%
  otherIncomeMonthly: 500, // Laundry, late fees, etc.

  // Valuation
  marketCapRate: 8.0, // MH parks typically 7-10% cap
};

/**
 * Explanations for each result metric (shown in Learn Mode)
 */
export const MH_PARK_METRIC_EXPLANATIONS: Record<keyof MhParkCalculatorResults, string> = {
  // Occupancy
  occupancyRate:
    'Percentage of lots currently occupied. Formula: Occupied Lots / Total Lots × 100. Healthy parks typically maintain 90%+ occupancy.',

  // Income Analysis
  grossPotentialRent:
    'Maximum annual rent if all lots were rented. Formula: Total Lots × Average Lot Rent × 12. This is your theoretical income ceiling.',

  effectiveGrossIncome:
    'Actual expected income after vacancy and including other income. Formula: GPR - Vacancy Loss + Other Income.',

  vacancyLoss:
    'Income lost due to unoccupied lots. Formula: Vacant Lots × Average Lot Rent × 12. This is the gap between potential and actual rent.',

  otherIncomeAnnual:
    'Annual income from non-rent sources: laundry facilities, late fees, application fees, storage, etc.',

  // Expense Analysis
  totalOperatingExpenses:
    'Annual operating costs. Formula: EGI × Expense Ratio. MH parks typically run 30-40% expense ratios (lower than apartments).',

  // Net Operating Income
  netOperatingIncome:
    'Annual income after all operating expenses, before debt service. Formula: EGI - Operating Expenses. This is the key metric for park valuation.',

  noiPerLot:
    'Net operating income divided by total lots. Formula: NOI / Total Lots. Useful for comparing parks of different sizes.',

  // Financing
  loanAmount:
    'Amount borrowed from the lender. Formula: Purchase Price - Down Payment. Commercial MH park loans typically require 20-30% down.',

  downPayment:
    'Cash paid at closing. Formula: Purchase Price × Down Payment %. Larger down payments typically get better rates.',

  closingCosts:
    'Transaction costs including lender fees, title insurance, appraisal, and legal fees. Typically 1.5-3% of purchase price.',

  totalInvestment:
    'Total cash required to acquire the property. Formula: Down Payment + Closing Costs. Your "cash in the deal."',

  monthlyDebtService:
    'Monthly mortgage payment (P&I). Based on loan amount, rate, and term. Key factor in cash flow calculation.',

  annualDebtService:
    'Annual mortgage payments. Formula: Monthly Debt Service × 12. Used to calculate DSCR and cash flow.',

  // Key Metrics
  capRate:
    'Capitalization rate. Formula: NOI / Purchase Price × 100. Measures return independent of financing. MH parks typically trade at 7-10% cap rates.',

  cashOnCashReturn:
    'Annual cash flow as a percentage of cash invested. Formula: Annual Cash Flow / Total Investment × 100. Compare to other investment returns.',

  debtServiceCoverageRatio:
    'Measures ability to pay debt from NOI. Formula: NOI / Annual Debt Service. Lenders typically require 1.20-1.35x for MH parks.',

  // Cash Flow
  monthlyCashFlow:
    'Monthly cash remaining after all expenses and debt service. Formula: (NOI - Debt Service) / 12. This is your monthly profit.',

  annualCashFlow:
    'Annual cash remaining after all expenses and debt service. Formula: NOI - Annual Debt Service. The actual money in your pocket.',

  // Valuation
  pricePerLot:
    'Purchase price divided by number of lots. Formula: Purchase Price / Total Lots. Key metric for comparing MH park deals. Texas typically $20K-$50K/lot.',

  estimatedMarketValue:
    'Estimated property value using market cap rate. Formula: NOI / Market Cap Rate. Compare to purchase price to assess deal quality.',

  grossRentMultiplier:
    'Quick valuation metric. Formula: Purchase Price / Annual GPR. Lower GRM = potentially better value. MH parks typically 6-10x.',
};

/**
 * DSCR thresholds for rating deals
 */
export const MH_PARK_DSCR_THRESHOLDS = {
  excellent: 1.5,
  good: 1.25,
  acceptable: 1.15,
  risky: 1.0,
} as const;

/**
 * Expense ratio benchmarks by park type
 */
export const MH_PARK_EXPENSE_BENCHMARKS = {
  tenantOwned: { label: 'Tenant-owned homes', range: '25-35%' },
  mixed: { label: 'Mixed (some POH)', range: '35-45%' },
  parkOwned: { label: 'Park-owned homes', range: '45-60%' },
} as const;

/**
 * Cap rate benchmarks by market
 */
export const MH_PARK_CAP_RATE_BENCHMARKS = {
  primary: { label: 'Primary markets', range: '6-8%' },
  secondary: { label: 'Secondary markets', range: '8-10%' },
  rural: { label: 'Rural markets', range: '10-12%' },
} as const;
