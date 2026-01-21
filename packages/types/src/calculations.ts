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
// Common Types
// ============================================

export interface CalculationError {
  field: string;
  message: string;
}

export type CalculationType = 'rental' | 'brrrr' | 'flip' | 'multifamily' | 'syndication';
