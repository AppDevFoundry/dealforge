import type { RentalInputs, RentalResults } from '@dealforge/types';

/**
 * Default values for the rental property calculator
 */
export const RENTAL_DEFAULTS: RentalInputs = {
  // Purchase
  purchasePrice: 200000,
  closingCosts: 4000,
  rehabCosts: 0,

  // Financing
  downPaymentPercent: 20,
  interestRate: 7.0,
  loanTermYears: 30,

  // Income
  monthlyRent: 1800,
  otherIncome: 0,
  vacancyRate: 5,

  // Expenses
  propertyTaxAnnual: 2400,
  insuranceAnnual: 1200,
  hoaMonthly: 0,
  maintenancePercent: 5,
  capexPercent: 5,
  managementPercent: 10,
};

/**
 * Explanations for each result metric (shown in Learn Mode)
 */
export const METRIC_EXPLANATIONS: Record<keyof RentalResults, string> = {
  cashOnCashReturn:
    'Annual cash flow divided by total cash invested. Formula: (Annual Cash Flow / Total Investment) x 100. A good target is 8-12% for most investors.',

  capRate:
    'Net Operating Income divided by purchase price. Formula: (NOI / Purchase Price) x 100. Useful for comparing properties regardless of financing. Market cap rates typically range from 4-10%.',

  totalRoi:
    'Total return on investment including cash flow and equity buildup over time. This is a simplified 5-year projection assuming no appreciation.',

  monthlyCashFlow:
    'Money left over each month after all expenses and mortgage payment. Formula: Effective Gross Income - Operating Expenses - Mortgage Payment.',

  annualCashFlow:
    'Total cash flow for the year. Formula: Monthly Cash Flow x 12. This is the actual money you pocket annually.',

  totalInvestment:
    'Total cash needed to acquire the property. Formula: Down Payment + Closing Costs + Rehab Costs. This is your "cash in the deal".',

  loanAmount:
    'Amount borrowed from the lender. Formula: Purchase Price - Down Payment. The mortgage will be based on this amount.',

  monthlyMortgage:
    'Monthly principal and interest payment (P&I). Calculated using standard amortization formula based on loan amount, interest rate, and term.',

  grossMonthlyIncome:
    'Total potential monthly income. Formula: Monthly Rent + Other Income. This is income before any deductions.',

  effectiveGrossIncome:
    'Income after accounting for vacancy. Formula: Gross Income - Vacancy Loss. This is what you realistically expect to collect.',

  totalMonthlyExpenses:
    'Sum of all operating expenses excluding mortgage. Includes: Property Tax, Insurance, HOA, Maintenance, CapEx reserves, and Property Management.',

  netOperatingIncome:
    'Annual income minus operating expenses, before debt service. Formula: (Effective Gross Income - Operating Expenses) x 12. Key metric for valuing commercial properties.',

  debtServiceCoverageRatio:
    'Measures ability to cover debt payments. Formula: NOI / Annual Debt Service. Lenders typically require 1.25x or higher. Below 1.0 means negative cash flow.',

  year1PrincipalPaydown:
    'Amount of principal paid off in the first year. This is "forced savings" that builds equity. Early years have more interest, later years have more principal.',

  year1InterestPaid:
    'Interest portion of mortgage payments in year 1. This is tax-deductible for rental properties (consult a tax professional).',

  fiveYearEquity:
    'Estimated equity after 5 years from principal paydown only. Does not include appreciation. Formula: Down Payment + 5 Years of Principal Paydown.',

  fiveYearTotalReturn:
    'Simplified 5-year return including cash flow and equity buildup. Formula: (5yr Cash Flow + Equity Gain) / Total Investment x 100. Does not include appreciation.',
};

/**
 * Input field labels and descriptions for potential future Learn Mode expansion
 */
export const INPUT_LABELS = {
  // Purchase
  purchasePrice: { label: 'Purchase Price', prefix: '$' },
  closingCosts: { label: 'Closing Costs', prefix: '$' },
  rehabCosts: { label: 'Rehab/Repair Costs', prefix: '$' },

  // Financing
  downPaymentPercent: { label: 'Down Payment', suffix: '%' },
  interestRate: { label: 'Interest Rate', suffix: '%' },
  loanTermYears: { label: 'Loan Term', suffix: 'years' },

  // Income
  monthlyRent: { label: 'Monthly Rent', prefix: '$' },
  otherIncome: { label: 'Other Income', prefix: '$' },
  vacancyRate: { label: 'Vacancy Rate', suffix: '%' },

  // Expenses
  propertyTaxAnnual: { label: 'Property Tax (Annual)', prefix: '$' },
  insuranceAnnual: { label: 'Insurance (Annual)', prefix: '$' },
  hoaMonthly: { label: 'HOA (Monthly)', prefix: '$' },
  maintenancePercent: { label: 'Maintenance', suffix: '%' },
  capexPercent: { label: 'CapEx Reserve', suffix: '%' },
  managementPercent: { label: 'Property Management', suffix: '%' },
} as const;
