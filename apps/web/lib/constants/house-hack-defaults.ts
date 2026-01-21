import type { HouseHackInputs, HouseHackResults } from '@dealforge/types';

/**
 * Default values for the House Hack calculator
 */
export const HOUSE_HACK_DEFAULTS: HouseHackInputs = {
  // Purchase
  purchasePrice: 350000,
  closingCosts: 7000,

  // Financing (FHA default)
  downPaymentPercent: 3.5,
  interestRate: 7.0,
  loanTermYears: 30,

  // Units
  numberOfUnits: 2,
  ownerUnit: 1,
  unit1Rent: 0,
  unit2Rent: 1400,
  unit3Rent: 1200,
  unit4Rent: 1100,
  ownerEquivalentRent: 1500,

  // Expenses
  propertyTaxAnnual: 4200,
  insuranceAnnual: 1800,
  hoaMonthly: 0,
  maintenancePercent: 5,
  capexPercent: 5,
  managementPercent: 8,
  vacancyRate: 5,
};

/**
 * Explanations for each result metric (shown in Learn Mode)
 */
export const HOUSE_HACK_METRIC_EXPLANATIONS: Record<keyof HouseHackResults, string> = {
  netHousingCost:
    'Your actual monthly housing cost after tenant rent offsets your mortgage and expenses. Negative means tenants cover everything and you pocket the difference.',

  savingsVsRenting:
    'How much you save monthly compared to renting a similar place. Formula: Equivalent Rent - Net Housing Cost. Higher is better.',

  effectiveHousingCost:
    'What you effectively pay each month to live in your unit. Mortgage + Expenses - Rental Income. The goal is to get this as low (or negative) as possible.',

  cashFlowAllRented:
    'Monthly cash flow if you move out and rent all units including yours. Uses your equivalent rent as the market rate for your unit and adds management fees.',

  cashOnCashReturn:
    'Annual return on your cash invested if all units are rented. Formula: Annual Cash Flow (all rented) / Total Investment × 100.',

  totalMonthlyRent:
    'Total monthly rental income from your tenant-occupied units. Does not include your owner-occupied unit.',

  monthlyMortgage:
    'Monthly principal and interest payment on your loan. Calculated using standard amortization.',

  totalMonthlyExpenses:
    'Operating expenses excluding mortgage: Property Tax, Insurance, HOA, Maintenance, and CapEx reserves.',

  totalInvestment:
    'Total cash invested upfront. Formula: Down Payment + Closing Costs. With FHA (3.5% down), this is significantly lower than conventional.',

  loanAmount:
    'Total loan amount. Formula: Purchase Price × (1 - Down Payment %). FHA loans allow up to 96.5% financing on 2-4 unit properties.',

  breakEvenRent:
    'Minimum monthly gross rent needed from tenants to make your housing cost zero. If your tenants pay this much, you live for free.',
};
