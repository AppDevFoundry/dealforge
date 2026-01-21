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
 * Main calculation function for BRRRR analysis
 * Models: Buy → Rehab → Rent → Refinance → Repeat
 * This is a pure function designed for easy porting to Rust/WASM
 */
export function calculateBRRRRMetrics(inputs: BRRRRInputs): BRRRRResults {
  // === PHASE 1: ACQUISITION ===
  const initialDownPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const initialLoanAmount = inputs.purchasePrice - initialDownPayment;
  const holdingCostsTotal = inputs.holdingCostsMonthly * inputs.rehabDurationMonths;
  const totalCashIn =
    initialDownPayment + inputs.closingCosts + inputs.rehabCosts + holdingCostsTotal;
  const allInCost =
    inputs.purchasePrice + inputs.closingCosts + inputs.rehabCosts + holdingCostsTotal;

  // === PHASE 2: REFINANCE ===
  const newLoanAmount = inputs.afterRepairValue * (inputs.refinanceLtv / 100);
  const cashRecoveredAtRefi = newLoanAmount - initialLoanAmount - inputs.refinanceClosingCosts;
  const cashLeftInDeal = totalCashIn - cashRecoveredAtRefi;
  const equityAtRefi = inputs.afterRepairValue - newLoanAmount;
  const infiniteReturn = cashLeftInDeal <= 0;

  // New loan monthly payment (post-refinance permanent financing)
  const refinanceMonthlyRate = inputs.refinanceRate / 100 / 12;
  const refinanceNumPayments = inputs.refinanceTermYears * 12;
  const newMonthlyPayment = calculateMonthlyPayment(
    newLoanAmount,
    refinanceMonthlyRate,
    refinanceNumPayments
  );

  // === PHASE 3: ONGOING RENTAL (post-refinance) ===

  // Income
  const grossMonthlyIncome = inputs.monthlyRent + inputs.otherIncome;
  const vacancyLoss = grossMonthlyIncome * (inputs.vacancyRate / 100);
  const effectiveGrossIncome = grossMonthlyIncome - vacancyLoss;

  // Expenses
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

  // Key metrics (post-refinance)
  const netOperatingIncome = (effectiveGrossIncome - totalMonthlyExpenses) * 12;
  const monthlyCashFlow = effectiveGrossIncome - totalMonthlyExpenses - newMonthlyPayment;
  const annualCashFlow = monthlyCashFlow * 12;

  // Cash on Cash uses cash left in deal as denominator
  const cashOnCashReturn =
    infiniteReturn || cashLeftInDeal <= 0
      ? Number.POSITIVE_INFINITY
      : (annualCashFlow / cashLeftInDeal) * 100;

  // Cap Rate based on ARV (post-rehab value)
  const capRate =
    inputs.afterRepairValue > 0 ? (netOperatingIncome / inputs.afterRepairValue) * 100 : 0;

  // Debt Service Coverage Ratio
  const annualDebtService = newMonthlyPayment * 12;
  const debtServiceCoverageRatio =
    annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;

  // === POST-REFINANCE AMORTIZATION (Year 1) ===
  const { principalYear1, interestYear1 } = calculateFirstYearAmortization(
    newLoanAmount,
    refinanceMonthlyRate,
    newMonthlyPayment
  );

  // === 5-YEAR PROJECTIONS (post-refinance) ===
  let balance = newLoanAmount;
  let fiveYearPrincipal = 0;
  for (let i = 0; i < 60; i++) {
    const interest = balance * refinanceMonthlyRate;
    const principal = newMonthlyPayment - interest;
    fiveYearPrincipal += principal;
    balance -= principal;
  }

  const fiveYearEquity = equityAtRefi + fiveYearPrincipal;
  const fiveYearCashFlow = annualCashFlow * 5;
  const effectiveInvestment = Math.max(cashLeftInDeal, 0);
  const fiveYearTotalReturn =
    effectiveInvestment > 0
      ? ((fiveYearCashFlow + fiveYearPrincipal) / effectiveInvestment) * 100
      : Number.POSITIVE_INFINITY;

  const totalRoi = Number.isFinite(fiveYearTotalReturn)
    ? fiveYearTotalReturn / 5
    : Number.POSITIVE_INFINITY;

  return {
    // Key metrics
    cashOnCashReturn,
    capRate,
    totalRoi,
    monthlyCashFlow,
    annualCashFlow,

    // Detailed breakdown
    totalInvestment: totalCashIn,
    loanAmount: newLoanAmount,
    monthlyMortgage: newMonthlyPayment,
    grossMonthlyIncome,
    effectiveGrossIncome,
    totalMonthlyExpenses,
    netOperatingIncome,
    debtServiceCoverageRatio,

    // Amortization (post-refinance Year 1)
    year1PrincipalPaydown: principalYear1,
    year1InterestPaid: interestYear1,

    // Projections
    fiveYearEquity,
    fiveYearTotalReturn,

    // BRRRR-specific
    cashLeftInDeal,
    cashRecoveredAtRefi,
    allInCost,
    equityAtRefi,
    newLoanAmount,
    newMonthlyPayment,
    infiniteReturn,
  };
}
