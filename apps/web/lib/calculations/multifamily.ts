import type { MultifamilyInputs, MultifamilyResults } from '@dealforge/types';

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
 * Main calculation function for Multi-family analysis
 * Models a 5-50 unit apartment building with unit mix, NOI, DSCR, and expense analysis
 * This is a pure function designed for easy porting to Rust/WASM
 */
export function calculateMultifamilyMetrics(inputs: MultifamilyInputs): MultifamilyResults {
  // === INCOME ===
  const monthlyRentalIncome =
    inputs.units1BR * inputs.rent1BR +
    inputs.units2BR * inputs.rent2BR +
    inputs.units3BR * inputs.rent3BR;
  const annualRentalIncome = monthlyRentalIncome * 12;

  const monthlyOtherIncome =
    inputs.laundryMonthly + inputs.parkingMonthly + inputs.petFeesMonthly + inputs.storageMonthly;
  const totalOtherIncome = monthlyOtherIncome * 12;

  const grossPotentialIncome = annualRentalIncome + totalOtherIncome;

  const vacancyLoss = grossPotentialIncome * (inputs.vacancyRate / 100);
  const effectiveGrossIncome = grossPotentialIncome - vacancyLoss;

  // === EXPENSES ===
  let totalAnnualExpenses: number;

  if (inputs.useExpenseRatio) {
    totalAnnualExpenses = effectiveGrossIncome * (inputs.expenseRatio / 100);
  } else {
    const managementAnnual = effectiveGrossIncome * (inputs.managementPercent / 100);
    totalAnnualExpenses =
      inputs.propertyTaxAnnual +
      inputs.insuranceAnnual +
      inputs.utilitiesMonthly * 12 +
      inputs.maintenanceMonthly * 12 +
      managementAnnual +
      inputs.payrollMonthly * 12 +
      inputs.adminMonthly * 12 +
      inputs.contractServicesMonthly * 12 +
      inputs.replacementReservesMonthly * 12;
  }

  const totalMonthlyExpenses = totalAnnualExpenses / 12;

  // === NOI ===
  const netOperatingIncome = effectiveGrossIncome - totalAnnualExpenses;

  // === FINANCING ===
  const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPayment;
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.loanTermYears * 12;
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, monthlyRate, numPayments);
  const annualDebtService = monthlyMortgage * 12;

  // === TOTAL INVESTMENT ===
  const totalInvestment = downPayment + inputs.closingCosts;

  // === CASH FLOW ===
  const annualCashFlow = netOperatingIncome - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  // === RETURN METRICS ===
  const capRate = inputs.purchasePrice > 0 ? (netOperatingIncome / inputs.purchasePrice) * 100 : 0;
  const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;
  const debtServiceCoverageRatio =
    annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;

  // === VALUATION ===
  const marketValue =
    inputs.marketCapRate > 0 ? netOperatingIncome / (inputs.marketCapRate / 100) : 0;
  const pricePerUnit = inputs.numberOfUnits > 0 ? inputs.purchasePrice / inputs.numberOfUnits : 0;
  const grossRentMultiplier =
    annualRentalIncome > 0 ? inputs.purchasePrice / annualRentalIncome : 0;

  // === EXPENSE ANALYSIS ===
  const expenseRatioActual =
    effectiveGrossIncome > 0 ? (totalAnnualExpenses / effectiveGrossIncome) * 100 : 0;

  // Break-even occupancy: minimum occupancy to cover expenses + debt service
  const breakEvenOccupancy =
    grossPotentialIncome > 0
      ? ((totalAnnualExpenses + annualDebtService) / grossPotentialIncome) * 100
      : 0;

  return {
    grossPotentialIncome,
    effectiveGrossIncome,
    netOperatingIncome,
    totalOtherIncome,
    capRate,
    cashOnCashReturn,
    debtServiceCoverageRatio,
    marketValue,
    pricePerUnit,
    grossRentMultiplier,
    expenseRatioActual,
    breakEvenOccupancy,
    totalMonthlyExpenses,
    monthlyCashFlow,
    annualCashFlow,
    totalInvestment,
    loanAmount,
    monthlyMortgage,
  };
}
