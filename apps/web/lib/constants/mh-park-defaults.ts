import type { MhParkInputs, MhParkResults } from '@dealforge/types';

export const MH_PARK_DEFAULTS: MhParkInputs = {
  lotCount: 50,
  averageLotRent: 350,
  occupancyRate: 85,
  expenseRatio: 35,
  purchasePrice: 1_500_000,
  downPaymentPercent: 25,
  interestRate: 7.0,
  loanTermYears: 10,
  amortizationYears: 25,
};

export const MH_PARK_METRIC_EXPLANATIONS: Record<keyof MhParkResults, string> = {
  grossPotentialIncome:
    'Total annual income if all lots are occupied at the stated rent. Calculated as lot count times average lot rent times 12 months.',
  vacancyLoss: 'Estimated income lost due to vacant lots. Based on your occupancy rate assumption.',
  effectiveGrossIncome:
    'Actual expected income after accounting for vacancy. This is what you can realistically expect to collect.',
  totalOperatingExpenses:
    'All costs to operate the park including management, maintenance, utilities, insurance, and taxes. Expressed as a percentage of effective gross income.',
  netOperatingIncome:
    'Income remaining after all operating expenses but before debt service. The key metric for valuing commercial real estate.',
  capRate:
    'Net Operating Income divided by purchase price. Measures the unlevered return and is used to compare properties independent of financing.',
  monthlyCashFlow:
    'Monthly income after all expenses and debt payments. What actually flows to your pocket each month.',
  annualCashFlow: 'Yearly income after all expenses and debt payments. Monthly cash flow times 12.',
  cashOnCashReturn:
    'Annual cash flow divided by your total cash invested (down payment). Measures the return on your actual cash in the deal.',
  loanAmount: 'Total amount borrowed. Purchase price minus your down payment.',
  monthlyDebtService:
    'Monthly loan payment including principal and interest based on your loan terms.',
  annualDebtService: 'Total yearly loan payments. Monthly debt service times 12.',
  totalInvestment: 'Total cash you need to close the deal. Your down payment amount.',
  debtServiceCoverageRatio:
    'NOI divided by annual debt service. Lenders typically require 1.2x or higher. Below 1.0 means the property cannot cover its debt.',
  noiPerLot:
    'Net Operating Income divided by number of lots. Useful for comparing parks of different sizes.',
  pricePerLot:
    'Purchase price divided by number of lots. A key metric for comparing park valuations.',
};
