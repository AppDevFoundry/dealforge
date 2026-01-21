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

export interface BRRRRInputs extends RentalInputs {
  // Additional BRRRR-specific
  afterRepairValue: number;
  refinanceLtv: number;
  refinanceRate: number;
  refinanceTermYears: number;
  refinanceClosingCosts: number;
  holdingCostsMonthly: number;
  rehabDurationMonths: number;
}

export interface BRRRRResults extends RentalResults {
  // BRRRR-specific results
  cashLeftInDeal: number;
  cashRecoveredAtRefi: number;
  allInCost: number;
  equityAtRefi: number;
  newLoanAmount: number;
  newMonthlyPayment: number;
  infiniteReturn: boolean;
}

// ============================================
// Flip/Rehab Calculator
// ============================================

export interface FlipInputs {
  purchasePrice: number;
  closingCostsBuy: number;
  rehabCosts: number;
  afterRepairValue: number;
  closingCostsSell: number;
  agentCommissionPercent: number;
  holdingCostsMonthly: number;
  holdingPeriodMonths: number;

  // Financing (optional)
  useLoan: boolean;
  loanAmount?: number;
  interestRate?: number;
  pointsPercent?: number;
}

export interface FlipResults {
  grossProfit: number;
  netProfit: number;
  roi: number;
  annualizedRoi: number;
  totalCosts: number;
  totalInvestment: number;
  breakEvenPrice: number;
  profitMargin: number;
  maxAllowableOffer: number;
}

// ============================================
// House Hack Calculator
// ============================================

export interface HouseHackInputs {
  // Purchase
  purchasePrice: number;
  closingCosts: number;

  // Financing
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;

  // Units
  numberOfUnits: number;
  ownerUnit: number;
  unit1Rent: number;
  unit2Rent: number;
  unit3Rent: number;
  unit4Rent: number;
  ownerEquivalentRent: number;

  // Expenses
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  hoaMonthly: number;
  maintenancePercent: number;
  capexPercent: number;
  managementPercent: number;
  vacancyRate: number;
}

export interface HouseHackResults {
  // Key metrics
  netHousingCost: number;
  savingsVsRenting: number;
  effectiveHousingCost: number;
  cashFlowAllRented: number;
  cashOnCashReturn: number;

  // Breakdown
  totalMonthlyRent: number;
  monthlyMortgage: number;
  totalMonthlyExpenses: number;
  totalInvestment: number;
  loanAmount: number;
  breakEvenRent: number;
}

// ============================================
// Multi-family Calculator
// ============================================

export interface MultifamilyInputs {
  // Purchase
  purchasePrice: number;
  closingCosts: number;

  // Units
  numberOfUnits: number;
  units1BR: number;
  rent1BR: number;
  units2BR: number;
  rent2BR: number;
  units3BR: number;
  rent3BR: number;

  // Other Income
  laundryMonthly: number;
  parkingMonthly: number;
  petFeesMonthly: number;
  storageMonthly: number;

  // Vacancy
  vacancyRate: number;

  // Expenses
  useExpenseRatio: boolean;
  expenseRatio: number;
  propertyTaxAnnual: number;
  insuranceAnnual: number;
  utilitiesMonthly: number;
  maintenanceMonthly: number;
  managementPercent: number;
  payrollMonthly: number;
  adminMonthly: number;
  contractServicesMonthly: number;
  replacementReservesMonthly: number;

  // Financing
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;

  // Valuation
  marketCapRate: number;
}

export interface MultifamilyResults {
  // Income Metrics
  grossPotentialIncome: number;
  effectiveGrossIncome: number;
  netOperatingIncome: number;
  totalOtherIncome: number;

  // Return Metrics
  capRate: number;
  cashOnCashReturn: number;
  debtServiceCoverageRatio: number;

  // Valuation
  marketValue: number;
  pricePerUnit: number;
  grossRentMultiplier: number;

  // Expense Analysis
  expenseRatioActual: number;
  breakEvenOccupancy: number;
  totalMonthlyExpenses: number;

  // Cash Flow
  monthlyCashFlow: number;
  annualCashFlow: number;

  // Investment
  totalInvestment: number;
  loanAmount: number;
  monthlyMortgage: number;
}

// ============================================
// Common Types
// ============================================

export interface CalculationError {
  field: string;
  message: string;
}

export type CalculationType =
  | 'rental'
  | 'brrrr'
  | 'flip'
  | 'house_hack'
  | 'multifamily'
  | 'syndication';
