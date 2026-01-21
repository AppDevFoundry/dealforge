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
}

// ============================================
// Common Types
// ============================================

export interface CalculationError {
  field: string;
  message: string;
}

export type CalculationType = 'rental' | 'brrrr' | 'flip' | 'multifamily' | 'syndication';
