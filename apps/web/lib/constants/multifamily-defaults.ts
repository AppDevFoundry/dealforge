import type { MultifamilyInputs, MultifamilyResults } from '@dealforge/types';

/**
 * Default values for the multi-family calculator
 * Assumes a 12-unit apartment building
 */
export const MULTIFAMILY_DEFAULTS: MultifamilyInputs = {
  // Property Info
  purchasePrice: 1500000,
  closingCostsPercent: 2,
  totalUnits: 12,
  squareFootage: 10000,

  // Unit Mix (12 units total)
  studioCount: 0,
  studioRent: 800,
  oneBedCount: 4,
  oneBedRent: 1000,
  twoBedCount: 6,
  twoBedRent: 1300,
  threeBedCount: 2,
  threeBedRent: 1600,

  // Other Income (monthly)
  laundryIncome: 200,
  parkingIncome: 300,
  storageIncome: 100,
  petFees: 150,
  otherIncome: 0,

  // Vacancy & Credit Loss
  vacancyRate: 5,
  creditLossRate: 2,

  // Operating Expenses
  useExpenseRatio: true,
  expenseRatio: 45, // 45% of EGI is typical

  // Itemized Expenses (as backup)
  propertyTaxAnnual: 18000,
  insuranceAnnual: 6000,
  utilitiesAnnual: 4800,
  repairsMaintenanceAnnual: 6000,
  managementPercent: 8,
  payrollAnnual: 0,
  advertisingAnnual: 1200,
  legalAccountingAnnual: 2400,
  landscapingAnnual: 2400,
  contractServicesAnnual: 3600,
  reservesPercent: 5,

  // Financing
  downPaymentPercent: 25,
  interestRate: 7.0,
  loanTermYears: 10,
  amortizationYears: 25,
  loanPointsPercent: 1,

  // Valuation
  marketCapRate: 6.5,
};

/**
 * Explanations for each result metric (shown in Learn Mode)
 */
export const MULTIFAMILY_METRIC_EXPLANATIONS: Record<keyof MultifamilyResults, string> = {
  // Income Analysis
  grossPotentialRent:
    'Annual rent if all units were occupied at market rent. Formula: Sum of (Unit Count × Monthly Rent × 12) for each unit type.',

  grossPotentialRentMonthly:
    "Monthly rent if all units were occupied. This is the property's maximum rental income potential.",

  otherIncomeAnnual:
    'Annual income from sources other than rent: laundry, parking, storage, pet fees, and other miscellaneous income.',

  grossPotentialIncome:
    'Total potential annual income. Formula: Gross Potential Rent + Other Income. This is the theoretical maximum income.',

  vacancyLoss:
    'Expected annual income loss due to vacant units. Formula: GPR × Vacancy Rate. Industry standard is 5-10% depending on market.',

  creditLoss:
    'Expected annual loss from non-paying tenants. Formula: GPR × Credit Loss Rate. Typically 1-3% in stable markets.',

  effectiveGrossIncome:
    'Realistic annual income after vacancy and credit losses. Formula: GPI - Vacancy Loss - Credit Loss. This is what you actually collect.',

  effectiveGrossIncomeMonthly:
    'Monthly effective gross income. EGI is the baseline for calculating expenses and NOI.',

  // Expense Analysis
  totalOperatingExpenses:
    'Annual operating costs to run the property. Includes taxes, insurance, utilities, maintenance, management, and reserves.',

  totalOperatingExpensesMonthly:
    'Monthly operating expenses. Monitor this against income to maintain profitability.',

  expenseRatioActual:
    'Operating expenses as a percentage of EGI. Formula: Total Expenses / EGI × 100. Typical range is 35-55% for multi-family.',

  // Net Operating Income
  netOperatingIncome:
    'Annual income after all operating expenses, before debt service. Formula: EGI - Operating Expenses. The key metric for commercial property valuation.',

  netOperatingIncomeMonthly:
    'Monthly NOI. This is the cash available to pay the mortgage and provide returns.',

  // Financing
  loanAmount:
    'Amount borrowed from the lender. Formula: Purchase Price - Down Payment. Commercial loans typically require 20-35% down.',

  downPayment:
    'Cash paid at closing. Formula: Purchase Price × Down Payment %. Larger down payments typically get better rates.',

  closingCosts:
    'Transaction costs including lender fees, title insurance, appraisal, and legal fees. Typically 1.5-3% of purchase price.',

  loanPoints:
    'Upfront fee paid to lender. Formula: Loan Amount × Points %. Each point equals 1% of the loan amount.',

  totalInvestment:
    'Total cash required to acquire the property. Formula: Down Payment + Closing Costs + Points. Your "cash in the deal."',

  monthlyDebtService:
    'Monthly mortgage payment (P&I). Based on loan amount, rate, and amortization period. Key factor in cash flow.',

  annualDebtService:
    'Annual mortgage payments. Formula: Monthly Debt Service × 12. Used to calculate DSCR and cash flow.',

  // Key Metrics
  capRatePurchase:
    'Capitalization rate at purchase price. Formula: NOI / Purchase Price × 100. Measures return independent of financing. Higher = better return but often more risk.',

  capRateMarket:
    'Market cap rate for similar properties. Used to estimate market value. Lower cap rates = higher values (more desirable markets).',

  debtServiceCoverageRatio:
    'Measures ability to pay debt from NOI. Formula: NOI / Annual Debt Service. Lenders typically require 1.20-1.35x. Below 1.0 means negative cash flow.',

  cashOnCashReturn:
    'Annual cash flow as a percentage of cash invested. Formula: Annual Cash Flow / Total Investment × 100. Compare to other investment returns.',

  monthlyCashFlow:
    'Monthly cash remaining after all expenses and debt service. Formula: (NOI - Debt Service) / 12. This is your monthly profit.',

  annualCashFlow:
    'Annual cash remaining after all expenses and debt service. Formula: NOI - Annual Debt Service. The actual money in your pocket.',

  // Valuation Metrics
  pricePerUnit:
    'Purchase price divided by number of units. Formula: Purchase Price / Total Units. Key metric for comparing multi-family deals.',

  pricePerSqFt:
    'Purchase price per square foot. Formula: Purchase Price / Square Footage. Useful for comparing properties of different sizes.',

  grossRentMultiplier:
    'Quick valuation metric. Formula: Purchase Price / Annual GPR. Lower GRM = potentially better value. Typical range is 8-15x.',

  estimatedMarketValue:
    'Estimated property value using market cap rate. Formula: NOI / Market Cap Rate. Compare to purchase price to assess deal quality.',

  // Break-Even Analysis
  breakEvenOccupancy:
    'Minimum occupancy to cover all costs. Formula: (Expenses + Debt Service) / GPR × 100. Below 75% is generally good.',

  breakEvenRentPerUnit:
    'Average rent per unit needed to break even. Formula: Monthly Costs / Total Units. Compare to actual rents for margin of safety.',

  // Per Unit Analysis
  noiPerUnit:
    'Net operating income per unit per year. Formula: NOI / Total Units. Useful for benchmarking against market.',

  expensesPerUnit:
    'Annual operating expenses per unit. Formula: Total Expenses / Total Units. Compare to market averages.',

  rentPerUnit:
    'Average monthly rent per unit. Formula: Monthly GPR / Total Units. Quick way to assess rent levels.',
};

/**
 * DSCR thresholds for rating deals
 */
export const DSCR_THRESHOLDS = {
  excellent: 1.5,
  good: 1.25,
  acceptable: 1.15,
  risky: 1.0,
} as const;

/**
 * Expense ratio benchmarks by property class
 */
export const EXPENSE_RATIO_BENCHMARKS = {
  classA: { label: 'Class A (Newer)', range: '35-45%' },
  classB: { label: 'Class B (Average)', range: '40-50%' },
  classC: { label: 'Class C (Older)', range: '45-55%' },
} as const;
