import type { HouseHackInputs, HouseHackResults } from '@dealforge/types';

/**
 * Default values for the house hack calculator
 * Assumes a typical duplex with FHA financing
 */
export const HOUSE_HACK_DEFAULTS: HouseHackInputs = {
  // Purchase
  purchasePrice: 300000,
  closingCosts: 6000,
  rehabCosts: 0,

  // Financing (FHA defaults)
  financingType: 'fha',
  downPaymentPercent: 3.5,
  interestRate: 6.5,
  loanTermYears: 30,
  pmiRate: 0.85, // Annual PMI rate as % of loan

  // Property Structure
  numberOfUnits: 2,
  ownerOccupiedUnit: 1,

  // Unit Rents
  unit1Rent: 1400,
  unit2Rent: 1400,
  unit3Rent: 0,
  unit4Rent: 0,

  // Owner's Housing Comparison
  equivalentRent: 1500, // What owner would pay elsewhere

  // Operating Expenses
  propertyTaxAnnual: 3600,
  insuranceAnnual: 1800,
  hoaMonthly: 0,
  maintenancePercent: 5,
  capexPercent: 5,
  utilitiesMonthly: 150,

  // Vacancy & Management
  vacancyRate: 5,
  managementPercent: 0, // Many house hackers self-manage
};

/**
 * Explanations for each result metric (shown in Learn Mode)
 */
export const HOUSE_HACK_METRIC_EXPLANATIONS: Record<keyof HouseHackResults, string> = {
  // Financing Summary
  loanAmount:
    'Amount borrowed from the lender. Formula: Purchase Price - Down Payment. FHA loans allow up to 96.5% financing on owner-occupied multi-family.',

  monthlyMortgage:
    'Monthly principal and interest payment (P&I). Calculated using standard amortization formula based on loan amount, interest rate, and term.',

  monthlyPmi:
    'Private Mortgage Insurance - required when down payment is less than 20%. Formula: (Loan Amount × PMI Rate) / 12. FHA loans have MIP (mortgage insurance premium) for the life of the loan.',

  totalMonthlyDebtService:
    'Total monthly housing payment to lender. Formula: Mortgage P&I + PMI. This is your base monthly obligation before expenses.',

  // Income Analysis
  grossPotentialRent:
    "Total rent if all units were rented at market rate. This represents the property's full income potential.",

  rentalIncomeMonthly:
    'Income from rented units only (excluding your unit). This is the actual rent collected from tenants.',

  effectiveRentalIncome:
    'Rental income after accounting for vacancy. Formula: Rental Income - (Rental Income × Vacancy Rate). Conservative estimate of actual collections.',

  ownerUnitPotentialRent:
    "Market rent for the unit you occupy. Important for calculating true investment returns and what you'd collect if you moved out.",

  // Expense Breakdown
  monthlyPropertyTax:
    'Monthly property tax allocation. Formula: Annual Property Tax / 12. Often included in mortgage payment (escrow).',

  monthlyInsurance:
    'Monthly insurance allocation. Formula: Annual Insurance / 12. Multi-family may require landlord policy.',

  monthlyMaintenance:
    'Monthly maintenance reserve. Formula: Gross Rent × Maintenance %. Industry standard is 5-10% for reserves.',

  monthlyCapex:
    'Capital expenditure reserve for major repairs. Formula: Gross Rent × CapEx %. Set aside for roof, HVAC, appliances.',

  monthlyManagement:
    'Property management fee. Formula: Effective Rent × Management %. Many house hackers self-manage (0%), but budget 8-10% if hiring.',

  totalMonthlyExpenses:
    'Sum of all operating expenses. Includes: Property Tax, Insurance, HOA, Maintenance, CapEx, Management, and Utilities.',

  // House Hack Metrics
  grossMonthlyCost:
    "Total monthly cost before rental income. Formula: Debt Service + Operating Expenses. This is what you'd pay with no tenants.",

  netHousingCost:
    'Your actual monthly housing cost after rental income. Formula: Gross Cost - Rental Income. The key house hack metric!',

  savingsVsRenting:
    "Money saved compared to renting elsewhere. Formula: Equivalent Rent - Net Housing Cost. Positive = you're winning!",

  effectiveHousingCost:
    'What you actually pay out of pocket monthly. Same as Net Housing Cost but shown as positive number for clarity.',

  livesForFree:
    'True when rental income covers all costs (Net Housing Cost ≤ $0). The ultimate house hack goal - tenants pay your mortgage!',

  // Investment Metrics
  cashFlowIfRented:
    "Monthly cash flow if you moved out and rented your unit. Shows the property's investment potential as a pure rental.",

  annualCashFlowIfRented:
    'Annual cash flow with all units rented. Formula: Monthly Cash Flow × 12. Your income potential after moving out.',

  cashOnCashIfRented:
    'Return on investment if all units were rented. Formula: (Annual Cash Flow / Total Investment) × 100. Compare to other investments.',

  capRate:
    'Capitalization rate based on all units rented. Formula: (NOI / Purchase Price) × 100. Useful for comparing properties.',

  netOperatingIncome:
    'Annual income minus expenses (before debt service) with all units rented. Key metric for property valuation.',

  // Break-Even Analysis
  breakEvenRent:
    'Total monthly rent needed to cover all costs. Formula: Debt Service + Expenses. If rental income exceeds this, you live for free.',

  rentCoverageRatio:
    'How much of costs are covered by rental income. Formula: Rental Income / Gross Cost. Over 100% = positive cash flow.',

  // Total Investment
  totalInvestment:
    'Total cash needed to acquire the property. Formula: Down Payment + Closing Costs + Rehab. Your "cash in the deal".',

  downPayment:
    'Cash paid at closing toward purchase. FHA: 3.5%, Conventional: 5-25%, VA: 0%. Lower down payment = more leverage but higher PMI.',
};

/**
 * Financing type options
 */
export const FINANCING_TYPES = [
  { value: 'fha', label: 'FHA (3.5% down)', minDown: 3.5 },
  { value: 'conventional', label: 'Conventional (5-25% down)', minDown: 5 },
  { value: 'va', label: 'VA (0% down)', minDown: 0 },
  { value: 'cash', label: 'Cash (No financing)', minDown: 100 },
] as const;

/**
 * Unit count options
 */
export const UNIT_COUNT_OPTIONS = [
  { value: 2, label: 'Duplex (2 units)' },
  { value: 3, label: 'Triplex (3 units)' },
  { value: 4, label: 'Fourplex (4 units)' },
] as const;
