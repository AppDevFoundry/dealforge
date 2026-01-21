import type { MultifamilyInputs } from '@dealforge/types';

export const MULTIFAMILY_DEFAULTS: MultifamilyInputs = {
  // Purchase
  purchasePrice: 1500000,
  closingCosts: 30000,

  // Units (12-unit example: 4x1BR, 6x2BR, 2x3BR)
  numberOfUnits: 12,
  units1BR: 4,
  rent1BR: 950,
  units2BR: 6,
  rent2BR: 1200,
  units3BR: 2,
  rent3BR: 1500,

  // Other Income
  laundryMonthly: 200,
  parkingMonthly: 300,
  petFeesMonthly: 150,
  storageMonthly: 100,

  // Vacancy
  vacancyRate: 8,

  // Expenses
  useExpenseRatio: false,
  expenseRatio: 45,
  propertyTaxAnnual: 18000,
  insuranceAnnual: 8000,
  utilitiesMonthly: 1200,
  maintenanceMonthly: 800,
  managementPercent: 8,
  payrollMonthly: 0,
  adminMonthly: 200,
  contractServicesMonthly: 300,
  replacementReservesMonthly: 500,

  // Financing
  downPaymentPercent: 25,
  interestRate: 7.0,
  loanTermYears: 30,

  // Valuation
  marketCapRate: 7.0,
};

export const MULTIFAMILY_METRIC_EXPLANATIONS: Record<string, string> = {
  grossPotentialIncome:
    'Total annual income if all units are rented at market rates plus other income sources. This is your theoretical maximum revenue.',
  effectiveGrossIncome:
    'Gross Potential Income minus vacancy and credit losses. This is the realistic income you can expect to collect.',
  netOperatingIncome:
    'Income minus all operating expenses, before debt service. NOI is the primary metric for valuing commercial properties.',
  totalOtherIncome:
    'Annual income from non-rent sources: laundry, parking, pet fees, and storage. Diversified income streams add stability.',
  capRate:
    'Net Operating Income divided by purchase price. Measures the return on the property independent of financing.',
  cashOnCashReturn:
    'Annual cash flow divided by total cash invested. Measures the return on your actual out-of-pocket investment.',
  debtServiceCoverageRatio:
    "NOI divided by annual debt service. Lenders typically require 1.20-1.25x. Below 1.0 means income doesn't cover the mortgage.",
  marketValue:
    'Property value estimated using the market cap rate applied to your NOI. Compare this to purchase price to assess the deal.',
  pricePerUnit:
    'Purchase price divided by number of units. Useful for comparing properties of different sizes in the same market.',
  grossRentMultiplier:
    'Purchase price divided by annual rental income. A quick screening metric — lower GRM suggests better value.',
  expenseRatioActual:
    'Operating expenses as a percentage of Effective Gross Income. Typical multifamily runs 40-50%. Higher ratios reduce NOI.',
  breakEvenOccupancy:
    'Minimum occupancy rate needed to cover all expenses and debt service. Lower is better — more room for vacancy.',
  totalMonthlyExpenses:
    'All operating expenses on a monthly basis, including taxes, insurance, utilities, maintenance, and management.',
  monthlyCashFlow:
    'Monthly cash remaining after all expenses and mortgage payment. This is what hits your bank account each month.',
  annualCashFlow:
    'Annual cash remaining after all expenses and debt service. Your total yearly profit from operations.',
  totalInvestment:
    'Down payment plus closing costs. This is the total cash required to acquire the property.',
  loanAmount: 'Purchase price minus down payment. The total amount financed by the lender.',
  monthlyMortgage:
    'Monthly principal and interest payment on the loan. Does not include taxes or insurance (those are in expenses).',
};
