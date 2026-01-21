import type { BRRRRInputs, BRRRRResults } from '@dealforge/types';

/**
 * Default values for the BRRRR calculator
 */
export const BRRRR_DEFAULTS: BRRRRInputs = {
  // Purchase
  purchasePrice: 150000,
  closingCosts: 3000,
  rehabCosts: 40000,

  // Initial Financing (hard money / short-term)
  downPaymentPercent: 100,
  interestRate: 12,
  loanTermYears: 1,

  // BRRRR-specific
  afterRepairValue: 225000,
  refinanceLtv: 75,
  refinanceRate: 7.0,
  refinanceTermYears: 30,
  refinanceClosingCosts: 3000,
  holdingCostsMonthly: 1500,
  rehabDurationMonths: 4,

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
export const BRRRR_METRIC_EXPLANATIONS: Record<keyof BRRRRResults, string> = {
  cashLeftInDeal:
    'Total cash invested minus cash recovered at refinance. If this is zero or negative, you got all (or more than) your money back — the hallmark of a successful BRRRR.',

  cashRecoveredAtRefi:
    'Cash pulled out at refinance. Formula: New Loan Amount - Initial Loan Balance - Refinance Closing Costs. Higher ARV and LTV mean more cash back.',

  allInCost:
    'Total cost of the project before refinancing. Formula: Purchase Price + Closing Costs + Rehab Costs + Holding Costs during rehab.',

  equityAtRefi:
    'Your equity position after refinancing. Formula: After Repair Value - New Loan Amount. This is your built-in profit from the value-add.',

  newLoanAmount:
    'The permanent loan amount after refinancing. Formula: ARV × Refinance LTV%. This replaces your initial short-term financing.',

  newMonthlyPayment:
    'Monthly P&I payment on the refinanced loan. This is your long-term debt service cost based on the refinance rate and term.',

  infiniteReturn:
    'When cash left in deal is zero or negative, your return is technically infinite — you have no money at risk while still collecting cash flow.',

  cashOnCashReturn:
    'Post-refinance annual cash flow divided by cash left in deal. Formula: Annual Cash Flow / Cash Left in Deal × 100. Infinite if no cash left in deal.',

  capRate:
    "Net Operating Income divided by After Repair Value. Formula: NOI / ARV × 100. Measures the property's yield independent of financing.",

  totalRoi:
    'Annualized 5-year total return including cash flow and equity buildup from the refinanced loan.',

  monthlyCashFlow:
    'Monthly income minus expenses minus refinanced mortgage payment. This is your ongoing profit after the BRRRR is complete.',

  annualCashFlow:
    'Total annual cash flow from the stabilized rental. Formula: Monthly Cash Flow × 12.',

  totalInvestment:
    'Total cash invested before refinancing. Formula: Down Payment + Closing Costs + Rehab Costs + Holding Costs. This is your "cash in" before the refi.',

  loanAmount: 'The new permanent loan amount after refinancing. Based on ARV and refinance LTV.',

  monthlyMortgage:
    'Monthly P&I on the refinanced permanent loan, calculated using standard amortization.',

  grossMonthlyIncome: 'Total potential monthly income. Formula: Monthly Rent + Other Income.',

  effectiveGrossIncome:
    'Income after vacancy. Formula: Gross Income × (1 - Vacancy Rate). What you realistically expect to collect.',

  totalMonthlyExpenses:
    'Operating expenses excluding mortgage: Property Tax, Insurance, HOA, Maintenance, CapEx, and Management.',

  netOperatingIncome:
    'Annual income minus operating expenses, before debt service. Formula: (Effective Gross Income - Expenses) × 12.',

  debtServiceCoverageRatio:
    'NOI divided by annual debt service on the refinanced loan. Lenders typically require 1.25x or higher.',

  year1PrincipalPaydown:
    'Principal paid on the refinanced loan in Year 1. Builds equity beyond the initial value-add.',

  year1InterestPaid:
    'Interest portion of refinanced loan payments in Year 1. Tax-deductible for rental properties.',

  fiveYearEquity:
    'Equity after 5 years: initial equity at refi plus 5 years of principal paydown on the new loan.',

  fiveYearTotalReturn:
    '5-year return from cash flow and principal paydown relative to cash left in deal. Infinite if no cash left in deal.',
};
