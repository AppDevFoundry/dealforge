/**
 * Calculator input/output types
 */

// ============================================
// Rental Property Calculator
// ============================================

export interface RentalInputs {
  // Purchase
  purchasePrice: number;
  closingCosts: number;
  rehabCosts: number;

  // Financing
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;

  // Income
  monthlyRent: number;
  otherIncome: number;
  vacancyRate: number;

  // Expenses
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenancePercent: number;
  capexPercent: number;
  managementPercent: number;
}

export interface RentalResults {
  // Key metrics
  cashOnCashReturn: number;
  capRate: number;
  totalRoi: number;
  monthlyCashFlow: number;
  annualCashFlow: number;

  // Detailed breakdown
  totalInvestment: number;
  loanAmount: number;
  monthlyMortgage: number;
  grossMonthlyIncome: number;
  effectiveGrossIncome: number;
  totalMonthlyExpenses: number;
  netOperatingIncome: number;
  debtServiceCoverageRatio: number;

  // Amortization summary
  year1PrincipalPaydown: number;
  year1InterestPaid: number;

  // Projections
  fiveYearEquity: number;
  fiveYearTotalReturn: number;
}

// ============================================
// BRRRR Calculator
// ============================================

export interface BRRRRInputs extends Omit<RentalInputs, 'downPaymentPercent' | 'interestRate' | 'loanTermYears'> {
  // Initial/Hard Money Financing (acquisition phase)
  initialLoanPercent: number; // LTV for acquisition (e.g., 90%)
  initialInterestRate: number; // Hard money rate (10-14%)
  initialPointsPercent: number; // Origination points (1-3%)
  initialTermMonths: number; // Loan term (6-18 months)

  // Rehab & Holding
  rehabDurationMonths: number;
  holdingCostsMonthly: number;

  // Refinance phase
  afterRepairValue: number;
  refinanceLtv: number;
  refinanceRate: number;
  refinanceTermYears: number;
  refinanceClosingCosts: number;
}

export interface BRRRRResults extends RentalResults {
  // Initial Financing Phase
  initialLoanAmount: number;
  initialDownPayment: number;
  initialPointsCost: number;
  initialMonthlyPayment: number;
  totalHoldingCosts: number;
  totalHoldingInterest: number;

  // BRRRR-specific results
  allInCost: number;
  cashLeftInDeal: number;
  cashRecoveredAtRefi: number;
  cashRecoveredPercent: number;
  equityAtRefi: number;
  newLoanAmount: number;
  newMonthlyPayment: number;
  infiniteReturn: boolean;
}

// ============================================
// Flip/Rehab Calculator
// ============================================

export interface FlipInputs {
  // Purchase
  purchasePrice: number;
  closingCostsBuyPercent: number; // As percentage of purchase price
  rehabCosts: number;

  // ARV & Sale
  afterRepairValue: number;
  agentCommissionPercent: number; // Total agent commission (typically 5-6%)
  closingCostsSellPercent: number; // As percentage of sale price

  // Holding Period
  holdingPeriodMonths: number;
  holdingCostsMonthly: number; // Utilities, taxes, insurance, etc.

  // Financing
  useLoan: boolean;
  loanToValuePercent: number; // LTV for purchase (0-100%)
  loanInterestRate: number; // Annual interest rate
  loanPointsPercent: number; // Origination points
  includeRehabInLoan: boolean; // Whether rehab is financed
}

export interface FlipResults {
  // Purchase Costs
  closingCostsBuy: number;
  totalAcquisitionCost: number;

  // Financing Details
  loanAmount: number;
  downPayment: number;
  loanPoints: number;
  monthlyLoanPayment: number;
  totalLoanInterest: number;

  // Holding Costs
  totalHoldingCosts: number;

  // Selling Costs
  agentCommission: number;
  closingCostsSell: number;
  totalSellingCosts: number;

  // Total Costs
  totalProjectCost: number;
  totalCashRequired: number;

  // Profit Metrics
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  annualizedRoi: number;

  // Analysis
  breakEvenPrice: number;
  maxAllowableOffer: number; // 70% Rule: ARV × 0.70 - Rehab
  dealMeetsSeventyPercentRule: boolean;
}

// ============================================
// House Hack Calculator
// ============================================

export interface HouseHackInputs {
  // Purchase
  purchasePrice: number;
  closingCosts: number;
  rehabCosts: number;

  // Financing
  financingType: 'fha' | 'conventional' | 'va' | 'cash';
  downPaymentPercent: number; // FHA: 3.5%, Conventional: typically 5-25%
  interestRate: number;
  loanTermYears: number;
  pmiRate: number; // PMI rate if down payment < 20%

  // Property Structure
  numberOfUnits: 2 | 3 | 4;
  ownerOccupiedUnit: number; // Which unit owner lives in (1-indexed)

  // Unit Rents (rent for each unit - owner's unit will show potential rent)
  unit1Rent: number;
  unit2Rent: number;
  unit3Rent: number; // Only used if numberOfUnits >= 3
  unit4Rent: number; // Only used if numberOfUnits >= 4

  // Owner's Housing Comparison
  equivalentRent: number; // What owner would pay elsewhere

  // Operating Expenses
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenancePercent: number; // % of gross rent
  capexPercent: number; // % of gross rent
  utilitiesMonthly: number; // Owner-paid utilities (common areas, etc.)

  // Vacancy & Management
  vacancyRate: number; // Applied to rented units only
  managementPercent: number; // % of collected rent (often 0 for house hackers)
}

export interface HouseHackResults {
  // Financing Summary
  loanAmount: number;
  monthlyMortgage: number; // P&I
  monthlyPmi: number;
  totalMonthlyDebtService: number; // Mortgage + PMI

  // Income Analysis
  grossPotentialRent: number; // All units at market rent
  rentalIncomeMonthly: number; // Income from rented units only
  effectiveRentalIncome: number; // After vacancy
  ownerUnitPotentialRent: number; // If owner moved out

  // Expense Breakdown
  monthlyPropertyTax: number;
  monthlyInsurance: number;
  monthlyMaintenance: number;
  monthlyCapex: number;
  monthlyManagement: number;
  totalMonthlyExpenses: number; // All operating expenses

  // House Hack Metrics (The Key Numbers)
  grossMonthlyCost: number; // Mortgage + PMI + Expenses
  netHousingCost: number; // Gross cost - rental income
  savingsVsRenting: number; // Equivalent rent - net housing cost
  effectiveHousingCost: number; // What owner actually pays monthly
  livesForFree: boolean; // Net housing cost <= 0

  // Investment Metrics (As If Rented)
  cashFlowIfRented: number; // Monthly cash flow if owner moves out
  annualCashFlowIfRented: number;
  cashOnCashIfRented: number; // CoC return treating owner unit as rented
  capRate: number;
  netOperatingIncome: number;

  // Break-Even Analysis
  breakEvenRent: number; // Rent needed to cover all costs
  rentCoverageRatio: number; // Rental income / gross costs

  // Total Investment
  totalInvestment: number; // Down payment + closing + rehab
  downPayment: number;
}

// ============================================
// Multi-family Calculator (5-50 units)
// ============================================

export interface UnitMix {
  unitType: string; // e.g., "Studio", "1BR", "2BR", "3BR"
  unitCount: number;
  monthlyRent: number;
}

export interface MultifamilyInputs {
  // Property Info
  purchasePrice: number;
  closingCostsPercent: number;
  totalUnits: number;
  squareFootage: number; // Total rentable sq ft

  // Unit Mix (simplified to 4 types)
  studioCount: number;
  studioRent: number;
  oneBedCount: number;
  oneBedRent: number;
  twoBedCount: number;
  twoBedRent: number;
  threeBedCount: number;
  threeBedRent: number;

  // Other Income (monthly)
  laundryIncome: number;
  parkingIncome: number;
  storageIncome: number;
  petFees: number;
  otherIncome: number;

  // Vacancy & Credit Loss
  vacancyRate: number; // % of gross potential rent
  creditLossRate: number; // % for bad debt/non-payment

  // Operating Expenses
  useExpenseRatio: boolean; // If true, use expense ratio instead of itemized
  expenseRatio: number; // As % of EGI (typical 40-55%)

  // Itemized Expenses (used if useExpenseRatio is false)
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  utilitiesAnnual: number; // Owner-paid utilities
  repairsMaintenanceAnnual: number;
  managementPercent: number; // % of collected rent
  payrollAnnual: number; // On-site staff
  advertisingAnnual: number;
  legalAccountingAnnual: number;
  landscapingAnnual: number;
  contractServicesAnnual: number; // Trash, pest, etc.
  reservesPercent: number; // CapEx reserves as % of EGI

  // Financing
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  amortizationYears: number; // Can differ from term (balloon)
  loanPointsPercent: number;

  // Valuation
  marketCapRate: number; // For estimating market value
}

export interface MultifamilyResults {
  // Income Analysis
  grossPotentialRent: number; // Annual GPR from all units
  grossPotentialRentMonthly: number;
  otherIncomeAnnual: number;
  grossPotentialIncome: number; // GPR + Other Income (annual)
  vacancyLoss: number;
  creditLoss: number;
  effectiveGrossIncome: number; // EGI (annual)
  effectiveGrossIncomeMonthly: number;

  // Expense Analysis
  totalOperatingExpenses: number; // Annual
  totalOperatingExpensesMonthly: number;
  expenseRatioActual: number; // Actual expense ratio (expenses / EGI)

  // Net Operating Income
  netOperatingIncome: number; // NOI (annual)
  netOperatingIncomeMonthly: number;

  // Financing
  loanAmount: number;
  downPayment: number;
  closingCosts: number;
  loanPoints: number;
  totalInvestment: number; // Down + closing + points
  monthlyDebtService: number;
  annualDebtService: number;

  // Key Metrics
  capRatePurchase: number; // NOI / Purchase Price
  capRateMarket: number; // Using input market cap rate
  debtServiceCoverageRatio: number; // NOI / Annual Debt Service
  cashOnCashReturn: number; // Annual Cash Flow / Total Investment
  monthlyCashFlow: number;
  annualCashFlow: number;

  // Valuation Metrics
  pricePerUnit: number;
  pricePerSqFt: number;
  grossRentMultiplier: number; // Purchase Price / Annual GPR
  estimatedMarketValue: number; // NOI / Market Cap Rate

  // Break-Even Analysis
  breakEvenOccupancy: number; // % occupancy to cover expenses + debt
  breakEvenRentPerUnit: number; // Average rent needed to break even

  // Per Unit Analysis
  noiPerUnit: number;
  expensesPerUnit: number;
  rentPerUnit: number; // Average
}

// ============================================
// Syndication Calculator (Advanced)
// ============================================

export interface WaterfallTier {
  name: string;
  lpSplit: number; // LP percentage (0-100)
  gpSplit: number; // GP percentage (0-100)
  irrHurdle?: number; // IRR hurdle to reach this tier (optional, % - e.g., 8 for 8%)
}

export interface YearlyProjection {
  year: number;
  noi: number;
  cashFlowBeforeDebt: number;
  debtService: number;
  cashFlowAfterDebt: number;
  lpDistribution: number;
  gpDistribution: number;
  cumulativeLpDistributions: number;
  cumulativeGpDistributions: number;
}

export interface SyndicationInputs {
  // Project Capitalization
  purchasePrice: number;
  closingCosts: number;
  capexReserves: number;
  totalCapitalization: number; // Calculated or input

  // Equity Structure
  lpEquityPercent: number; // LP contribution as % of total equity
  gpEquityPercent: number; // GP contribution as % of total equity (often 5-10%)

  // Debt
  loanToValue: number; // LTV percentage
  interestRate: number;
  loanTermYears: number;
  amortizationYears: number;
  interestOnly: boolean;
  interestOnlyYears: number;

  // Fees
  acquisitionFeePercent: number; // % of purchase price, paid to GP at close
  assetManagementFeePercent: number; // Annual % of equity, paid to GP

  // Preferred Return
  preferredReturn: number; // Annual % to LPs before any GP promote

  // Waterfall Tiers (simplified to 3 tiers)
  tier1LpSplit: number; // After pref return (e.g., 70)
  tier1GpSplit: number; // After pref return (e.g., 30)
  tier2IrrHurdle: number; // IRR hurdle for tier 2 (e.g., 12)
  tier2LpSplit: number; // After tier 2 hurdle (e.g., 60)
  tier2GpSplit: number; // After tier 2 hurdle (e.g., 40)
  tier3IrrHurdle: number; // IRR hurdle for tier 3 (e.g., 18)
  tier3LpSplit: number; // After tier 3 hurdle (e.g., 50)
  tier3GpSplit: number; // After tier 3 hurdle (e.g., 50)

  // Property Operations (Year 1)
  grossPotentialRent: number;
  vacancyRate: number;
  otherIncome: number;
  operatingExpenseRatio: number; // As % of EGI

  // Growth Assumptions
  rentGrowthRate: number; // Annual rent growth %
  expenseGrowthRate: number; // Annual expense growth %
  holdPeriodYears: number; // Investment hold period

  // Exit Assumptions
  exitCapRate: number; // Cap rate at sale
  dispositionFeePercent: number; // Selling costs as % of sale price
}

export interface SyndicationResults {
  // Capitalization Summary
  totalEquity: number;
  lpEquity: number;
  gpEquity: number;
  loanAmount: number;
  totalCapitalization: number;

  // Fee Summary
  acquisitionFee: number;
  totalAssetManagementFees: number; // Over hold period

  // Operating Projections
  yearlyProjections: YearlyProjection[];
  totalNoiOverHold: number;

  // Exit Analysis
  exitNoi: number;
  exitValue: number;
  dispositionCosts: number;
  netSaleProceeds: number;
  loanPayoff: number;
  equityAtSale: number;

  // LP Returns
  lpTotalDistributions: number;
  lpEquityMultiple: number; // Total distributions / LP equity
  lpIrr: number;
  lpPreferredReturnTotal: number;
  lpCashFlowDistributions: number;
  lpSaleProceedsDistribution: number;

  // GP Returns
  gpTotalDistributions: number;
  gpEquityMultiple: number;
  gpIrr: number;
  gpAcquisitionFee: number;
  gpAssetManagementFees: number;
  gpPromote: number; // Promote/carried interest
  gpCashFlowDistributions: number;
  gpSaleProceedsDistribution: number;

  // Deal Metrics
  goingInCapRate: number;
  averageCashOnCash: number;
  totalProfitOverHold: number;

  // Sensitivity Analysis (exit cap rate variations)
  sensitivityAnalysis: {
    exitCapRate: number;
    exitValue: number;
    lpIrr: number;
    lpEquityMultiple: number;
    gpIrr: number;
    gpEquityMultiple: number;
  }[];
}

// ============================================
// Common Types
// ============================================

export interface CalculationError {
  field: string;
  message: string;
}

export type CalculationType = 'rental' | 'brrrr' | 'flip' | 'house_hack' | 'multifamily' | 'syndication' | 'mh_park';
