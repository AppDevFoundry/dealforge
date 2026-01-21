import type { BRRRRInputs, BRRRRResults } from '@dealforge/types';

/**
 * Calculate monthly mortgage payment using standard amortization formula
 */
function calculateMonthlyPayment(
  principal: number,
  monthlyRate: number,
  numPayments: number
): number {
  if (principal <= 0) return 0;
  if (monthlyRate === 0) return principal / numPayments;

  return (
    (principal * (monthlyRate * (1 + monthlyRate) ** numPayments)) /
    ((1 + monthlyRate) ** numPayments - 1)
  );
}

/**
 * Calculate first year's principal and interest breakdown
 */
function calculateFirstYearAmortization(
  loanAmount: number,
  monthlyRate: number,
  monthlyPayment: number
): { principalYear1: number; interestYear1: number } {
  if (loanAmount <= 0 || monthlyPayment <= 0) {
    return { principalYear1: 0, interestYear1: 0 };
  }

  let balance = loanAmount;
  let principalYear1 = 0;
  let interestYear1 = 0;

  for (let i = 0; i < 12; i++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    principalYear1 += principal;
    interestYear1 += interest;
    balance -= principal;
  }

  return { principalYear1, interestYear1 };
}

/**
 * Calculate 5-year principal paydown
 */
function calculateFiveYearPrincipal(
  loanAmount: number,
  monthlyRate: number,
  monthlyPayment: number
): number {
  if (loanAmount <= 0 || monthlyPayment <= 0) {
    return 0;
  }

  let balance = loanAmount;
  let totalPrincipal = 0;

  for (let i = 0; i < 60; i++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    totalPrincipal += principal;
    balance -= principal;
  }

  return totalPrincipal;
}

/**
 * Main calculation function for BRRRR property analysis
 * Calculates metrics for the Buy-Rehab-Rent-Refinance-Repeat strategy
 */
export function calculateBRRRRMetrics(inputs: BRRRRInputs): BRRRRResults {
  // === PHASE 1: ACQUISITION (Initial/Hard Money Financing) ===
  const initialLoanAmount = inputs.purchasePrice * (inputs.initialLoanPercent / 100);
  const initialDownPayment = inputs.purchasePrice - initialLoanAmount;
  const initialPointsCost = initialLoanAmount * (inputs.initialPointsPercent / 100);

  // Interest-only payment for hard money loan
  const initialMonthlyPayment = initialLoanAmount * (inputs.initialInterestRate / 100 / 12);

  // === PHASE 2: HOLDING PERIOD ===
  const totalHoldingCosts = inputs.holdingCostsMonthly * inputs.rehabDurationMonths;
  const totalHoldingInterest = initialMonthlyPayment * inputs.rehabDurationMonths;

  // All-In Cost: Total cash invested before refinance
  const allInCost =
    initialDownPayment +
    inputs.closingCosts +
    initialPointsCost +
    inputs.rehabCosts +
    totalHoldingCosts +
    totalHoldingInterest;

  // === PHASE 3: REFINANCE ===
  const newLoanAmount = inputs.afterRepairValue * (inputs.refinanceLtv / 100);

  // Cash received at refinance (new loan pays off initial loan)
  const cashRecoveredAtRefi = newLoanAmount - initialLoanAmount - inputs.refinanceClosingCosts;

  // Cash left in deal after refinance (key BRRRR metric)
  const cashLeftInDeal = allInCost - cashRecoveredAtRefi;

  // Percentage of initial investment recovered
  const cashRecoveredPercent = allInCost > 0 ? (cashRecoveredAtRefi / allInCost) * 100 : 0;

  // Equity captured at refinance
  const equityAtRefi = inputs.afterRepairValue - newLoanAmount;

  // Infinite return achieved when all cash is recovered
  const infiniteReturn = cashLeftInDeal <= 0;

  // New mortgage calculation (post-refinance)
  const refiMonthlyRate = inputs.refinanceRate / 100 / 12;
  const refiNumPayments = inputs.refinanceTermYears * 12;
  const newMonthlyPayment = calculateMonthlyPayment(
    newLoanAmount,
    refiMonthlyRate,
    refiNumPayments
  );

  // === PHASE 4: RENTAL (Post-Refinance Operation) ===
  // For totalInvestment, we use cashLeftInDeal (actual cash still tied up)
  // If infinite return, use a small positive number to avoid division by zero
  const effectiveInvestment = infiniteReturn ? 1 : Math.max(cashLeftInDeal, 1);

  // === INCOME ===
  const grossMonthlyIncome = inputs.monthlyRent + inputs.otherIncome;
  const vacancyLoss = grossMonthlyIncome * (inputs.vacancyRate / 100);
  const effectiveGrossIncome = grossMonthlyIncome - vacancyLoss;

  // === EXPENSES ===
  const monthlyPropertyTax = inputs.propertyTaxAnnual / 12;
  const monthlyInsurance = inputs.insuranceAnnual / 12;
  const maintenanceExpense = grossMonthlyIncome * (inputs.maintenancePercent / 100);
  const capexExpense = grossMonthlyIncome * (inputs.capexPercent / 100);
  const managementExpense = grossMonthlyIncome * (inputs.managementPercent / 100);

  const totalMonthlyExpenses =
    monthlyPropertyTax +
    monthlyInsurance +
    inputs.hoaMonthly +
    maintenanceExpense +
    capexExpense +
    managementExpense;

  // === KEY METRICS (Post-Refinance) ===
  // Net Operating Income (annual, before debt service)
  const netOperatingIncome = (effectiveGrossIncome - totalMonthlyExpenses) * 12;

  // Cash flow (monthly and annual)
  const monthlyCashFlow = effectiveGrossIncome - totalMonthlyExpenses - newMonthlyPayment;
  const annualCashFlow = monthlyCashFlow * 12;

  // Cash on Cash Return (based on cash left in deal)
  const cashOnCashReturn = infiniteReturn
    ? Number.POSITIVE_INFINITY
    : effectiveInvestment > 0
      ? (annualCashFlow / effectiveInvestment) * 100
      : 0;

  // Cap Rate (based on ARV for BRRRR)
  const capRate =
    inputs.afterRepairValue > 0 ? (netOperatingIncome / inputs.afterRepairValue) * 100 : 0;

  // Debt Service Coverage Ratio
  const annualDebtService = newMonthlyPayment * 12;
  const debtServiceCoverageRatio =
    annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;

  // === AMORTIZATION (Post-Refinance Loan) ===
  const { principalYear1, interestYear1 } = calculateFirstYearAmortization(
    newLoanAmount,
    refiMonthlyRate,
    newMonthlyPayment
  );

  // === 5-YEAR PROJECTIONS ===
  const fiveYearPrincipal = calculateFiveYearPrincipal(
    newLoanAmount,
    refiMonthlyRate,
    newMonthlyPayment
  );
  const fiveYearEquity = equityAtRefi + fiveYearPrincipal;
  const fiveYearCashFlow = annualCashFlow * 5;
  const fiveYearTotalReturn = infiniteReturn
    ? Number.POSITIVE_INFINITY
    : effectiveInvestment > 0
      ? ((fiveYearCashFlow + fiveYearPrincipal) / effectiveInvestment) * 100
      : 0;

  // Total ROI (annualized 5-year return)
  const totalRoi = infiniteReturn ? Number.POSITIVE_INFINITY : fiveYearTotalReturn / 5;

  return {
    // Initial Financing Phase
    initialLoanAmount,
    initialDownPayment,
    initialPointsCost,
    initialMonthlyPayment,
    totalHoldingCosts,
    totalHoldingInterest,

    // BRRRR-specific results
    allInCost,
    cashLeftInDeal,
    cashRecoveredAtRefi,
    cashRecoveredPercent,
    equityAtRefi,
    newLoanAmount,
    newMonthlyPayment,
    infiniteReturn,

    // Key metrics (post-refinance)
    cashOnCashReturn,
    capRate,
    totalRoi,
    monthlyCashFlow,
    annualCashFlow,

    // Detailed breakdown
    totalInvestment: cashLeftInDeal > 0 ? cashLeftInDeal : allInCost,
    loanAmount: newLoanAmount,
    monthlyMortgage: newMonthlyPayment,
    grossMonthlyIncome,
    effectiveGrossIncome,
    totalMonthlyExpenses,
    netOperatingIncome,
    debtServiceCoverageRatio,

    // Amortization
    year1PrincipalPaydown: principalYear1,
    year1InterestPaid: interestYear1,

    // Projections
    fiveYearEquity,
    fiveYearTotalReturn,
  };
}
