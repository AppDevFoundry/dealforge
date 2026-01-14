import type { RentalInputs, RentalResults } from '@dealforge/types';

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
 * Calculate 5-year principal paydown (simplified - assumes same payment throughout)
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
 * Main calculation function for rental property analysis
 * This is a pure function designed for easy porting to Rust/WASM
 */
export function calculateRentalMetrics(inputs: RentalInputs): RentalResults {
  // === PURCHASE & FINANCING ===
  const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPayment;
  const totalInvestment = downPayment + inputs.closingCosts + inputs.rehabCosts;

  // Mortgage calculation
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.loanTermYears * 12;
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, monthlyRate, numPayments);

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

  // === KEY METRICS ===
  // Net Operating Income (annual, before debt service)
  const netOperatingIncome = (effectiveGrossIncome - totalMonthlyExpenses) * 12;

  // Cash flow (monthly and annual)
  const monthlyCashFlow = effectiveGrossIncome - totalMonthlyExpenses - monthlyMortgage;
  const annualCashFlow = monthlyCashFlow * 12;

  // Cash on Cash Return
  const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;

  // Cap Rate
  const capRate = inputs.purchasePrice > 0 ? (netOperatingIncome / inputs.purchasePrice) * 100 : 0;

  // Debt Service Coverage Ratio
  const annualDebtService = monthlyMortgage * 12;
  const debtServiceCoverageRatio =
    annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;

  // === AMORTIZATION ===
  const { principalYear1, interestYear1 } = calculateFirstYearAmortization(
    loanAmount,
    monthlyRate,
    monthlyMortgage
  );

  // === 5-YEAR PROJECTIONS (simplified - no appreciation) ===
  const fiveYearPrincipal = calculateFiveYearPrincipal(loanAmount, monthlyRate, monthlyMortgage);
  const fiveYearEquity = downPayment + fiveYearPrincipal;
  const fiveYearCashFlow = annualCashFlow * 5;
  const fiveYearTotalReturn =
    totalInvestment > 0 ? ((fiveYearCashFlow + fiveYearPrincipal) / totalInvestment) * 100 : 0;

  // Total ROI (simplified - using 5-year return annualized)
  const totalRoi = fiveYearTotalReturn / 5;

  return {
    // Key metrics
    cashOnCashReturn,
    capRate,
    totalRoi,
    monthlyCashFlow,
    annualCashFlow,

    // Detailed breakdown
    totalInvestment,
    loanAmount,
    monthlyMortgage,
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
