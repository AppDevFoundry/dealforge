import type { BRRRRInputs, BRRRRResults } from '@dealforge/types';

/**
 * Default values for the BRRRR calculator
 */
export const BRRRR_DEFAULTS: BRRRRInputs = {
  // Purchase
  purchasePrice: 100000,
  closingCosts: 2500,
  rehabCosts: 30000,

  // Initial/Hard Money Financing
  initialLoanPercent: 90,
  initialInterestRate: 12,
  initialPointsPercent: 2,
  initialTermMonths: 12,

  // Holding
  rehabDurationMonths: 3,
  holdingCostsMonthly: 800,

  // ARV & Refinance
  afterRepairValue: 180000,
  refinanceLtv: 75,
  refinanceRate: 7.0,
  refinanceTermYears: 30,
  refinanceClosingCosts: 3500,

  // Income
  monthlyRent: 1500,
  otherIncome: 0,
  vacancyRate: 5,

  // Expenses
  propertyTaxAnnual: 2000,
  insuranceAnnual: 1200,
  hoaMonthly: 0,
  maintenancePercent: 5,
  capexPercent: 5,
  managementPercent: 8,
};

/**
 * Explanations for BRRRR-specific metrics (shown in Learn Mode)
 */
export const BRRRR_METRIC_EXPLANATIONS: Record<keyof BRRRRResults, string> = {
  // Initial Financing Phase
  initialLoanAmount:
    'Amount borrowed from hard money or private lender for acquisition. Formula: Purchase Price x Initial Loan %. This loan is temporary and paid off at refinance.',

  initialDownPayment:
    'Cash needed for the initial purchase. Formula: Purchase Price - Initial Loan Amount. Lower down payment means more leverage but requires qualifying for higher LTV.',

  initialPointsCost:
    'Upfront fee paid to the initial lender. Formula: Initial Loan Amount x Points %. Points are typically 1-3% for hard money loans.',

  initialMonthlyPayment:
    'Monthly interest-only payment on the initial loan during rehab. Formula: Initial Loan Amount x (Interest Rate / 12). Hard money loans are typically interest-only.',

  totalHoldingCosts:
    'Total non-financing costs during rehab. Formula: Monthly Holding Costs x Rehab Duration. Includes utilities, taxes, insurance, lawn care, etc.',

  totalHoldingInterest:
    'Total interest paid during the rehab period. Formula: Initial Monthly Payment x Rehab Duration. Longer rehabs mean more carrying costs.',

  // BRRRR-specific
  allInCost:
    'Total cash invested before refinance. Formula: Down Payment + Closing Costs + Points + Rehab Costs + Holding Costs + Holding Interest. This is the money you need to have available.',

  cashLeftInDeal:
    'Cash remaining tied up after refinance. Formula: All-In Cost - Cash Recovered at Refi. Zero or negative means you got all your money back (infinite return).',

  cashRecoveredAtRefi:
    'Cash pulled out at refinance. Formula: New Loan Amount - Initial Loan Balance - Refinance Closing Costs. This is the money you can use for your next deal.',

  cashRecoveredPercent:
    'Percentage of initial investment recovered at refinance. Formula: (Cash Recovered / All-In Cost) x 100. 100% or higher means full capital recycling.',

  equityAtRefi:
    'Equity position after refinance. Formula: After Repair Value - New Loan Amount. This is your wealth created through the BRRRR process.',

  newLoanAmount:
    'Conventional loan amount after refinance. Formula: After Repair Value x Refinance LTV. This becomes your permanent financing.',

  newMonthlyPayment:
    'Monthly P&I payment on the refinanced loan. This is your permanent mortgage payment used to calculate ongoing cash flow.',

  infiniteReturn:
    'Whether you recovered all your initial investment at refinance. When true, you have zero cash in the deal and any positive cash flow is "infinite" return on invested capital.',

  // Key metrics (inherited + modified explanations)
  cashOnCashReturn:
    'Annual cash flow divided by cash left in deal. For BRRRR, this can be extremely high or infinite if you recovered all your capital. Formula: Annual Cash Flow / Cash Left in Deal.',

  capRate:
    'Net Operating Income divided by After Repair Value. Formula: NOI / ARV x 100. Useful for comparing to market cap rates.',

  totalRoi:
    'Total return including cash flow and equity buildup. For BRRRR, this is often very high due to low or zero capital remaining in the deal.',

  monthlyCashFlow:
    'Monthly income after all expenses and new mortgage payment. Formula: Effective Gross Income - Operating Expenses - New Mortgage Payment.',

  annualCashFlow:
    'Yearly cash flow after refinance. Formula: Monthly Cash Flow x 12. This is the recurring income from your BRRRR investment.',

  totalInvestment:
    'For BRRRR, this represents cash left in the deal after refinance (or all-in cost if no refinance benefit). Used to calculate returns.',

  loanAmount:
    'The new loan amount after refinance. This is your permanent financing on the property.',

  monthlyMortgage:
    'Monthly principal and interest payment on the refinanced loan. Used to calculate ongoing cash flow.',

  grossMonthlyIncome:
    'Total potential monthly rental income. Formula: Monthly Rent + Other Income.',

  effectiveGrossIncome:
    'Income after accounting for vacancy. Formula: Gross Income - (Gross Income x Vacancy Rate).',

  totalMonthlyExpenses:
    'Sum of all operating expenses excluding mortgage. Includes: Property Tax, Insurance, HOA, Maintenance, CapEx, and Management.',

  netOperatingIncome:
    'Annual income minus operating expenses, before debt service. Formula: (Effective Gross Income - Operating Expenses) x 12.',

  debtServiceCoverageRatio:
    'Measures ability to cover new mortgage payments. Formula: NOI / Annual Debt Service. Lenders typically require 1.25x or higher.',

  year1PrincipalPaydown:
    'Principal paid off in year 1 of the refinanced loan. This builds additional equity beyond what was captured at refinance.',

  year1InterestPaid:
    'Interest portion of new mortgage payments in year 1. Tax-deductible for rental properties.',

  fiveYearEquity:
    'Total equity after 5 years of holding. Formula: Equity at Refi + 5 Years of Principal Paydown. Does not include appreciation.',

  fiveYearTotalReturn:
    'Projected 5-year return on cash left in deal. Includes cash flow and equity buildup. Often extremely high for successful BRRRR deals.',
};

/**
 * Input field labels for BRRRR calculator
 */
export const BRRRR_INPUT_LABELS = {
  // Purchase
  purchasePrice: { label: 'Purchase Price', prefix: '$' },
  closingCosts: { label: 'Closing Costs', prefix: '$' },
  rehabCosts: { label: 'Rehab Costs', prefix: '$' },

  // Initial Financing
  initialLoanPercent: { label: 'Initial Loan (LTV)', suffix: '%' },
  initialInterestRate: { label: 'Initial Interest Rate', suffix: '%' },
  initialPointsPercent: { label: 'Origination Points', suffix: '%' },
  initialTermMonths: { label: 'Initial Loan Term', suffix: 'months' },

  // Holding
  rehabDurationMonths: { label: 'Rehab Duration', suffix: 'months' },
  holdingCostsMonthly: { label: 'Monthly Holding Costs', prefix: '$' },

  // ARV & Refinance
  afterRepairValue: { label: 'After Repair Value (ARV)', prefix: '$' },
  refinanceLtv: { label: 'Refinance LTV', suffix: '%' },
  refinanceRate: { label: 'Refinance Interest Rate', suffix: '%' },
  refinanceTermYears: { label: 'Refinance Term', suffix: 'years' },
  refinanceClosingCosts: { label: 'Refinance Closing Costs', prefix: '$' },

  // Income
  monthlyRent: { label: 'Monthly Rent', prefix: '$' },
  otherIncome: { label: 'Other Monthly Income', prefix: '$' },
  vacancyRate: { label: 'Vacancy Rate', suffix: '%' },

  // Expenses
  propertyTaxAnnual: { label: 'Property Tax (Annual)', prefix: '$' },
  insuranceAnnual: { label: 'Insurance (Annual)', prefix: '$' },
  hoaMonthly: { label: 'HOA (Monthly)', prefix: '$' },
  maintenancePercent: { label: 'Maintenance', suffix: '% of rent' },
  capexPercent: { label: 'CapEx Reserve', suffix: '% of rent' },
  managementPercent: { label: 'Property Management', suffix: '% of rent' },
} as const;
