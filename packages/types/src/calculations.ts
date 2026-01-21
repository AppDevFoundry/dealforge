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
// Common Types
// ============================================

export interface CalculationError {
  field: string;
  message: string;
}

export type CalculationType = 'rental' | 'brrrr' | 'flip' | 'house_hack' | 'multifamily' | 'syndication';
