import type { MhParkInputs, MhParkResults } from '@dealforge/types';

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

export function calculateMhParkMetrics(inputs: MhParkInputs): MhParkResults {
  // Income
  const grossPotentialIncome = inputs.lotCount * inputs.averageLotRent * 12;
  const vacancyLoss = grossPotentialIncome * (1 - inputs.occupancyRate / 100);
  const effectiveGrossIncome = grossPotentialIncome - vacancyLoss;

  // Expenses
  const totalOperatingExpenses = effectiveGrossIncome * (inputs.expenseRatio / 100);
  const netOperatingIncome = effectiveGrossIncome - totalOperatingExpenses;

  // Cap Rate
  const capRate = inputs.purchasePrice > 0 ? (netOperatingIncome / inputs.purchasePrice) * 100 : 0;

  // Financing
  const loanAmount = inputs.purchasePrice * (1 - inputs.downPaymentPercent / 100);
  const totalInvestment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.amortizationYears * 12;
  const monthlyDebtService = calculateMonthlyPayment(loanAmount, monthlyRate, numPayments);
  const annualDebtService = monthlyDebtService * 12;

  // Cash Flow
  const annualCashFlow = netOperatingIncome - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  // Returns
  const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;

  // Coverage
  const debtServiceCoverageRatio =
    annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;

  // Per-lot metrics
  const noiPerLot = inputs.lotCount > 0 ? netOperatingIncome / inputs.lotCount : 0;
  const pricePerLot = inputs.lotCount > 0 ? inputs.purchasePrice / inputs.lotCount : 0;

  return {
    grossPotentialIncome,
    vacancyLoss,
    effectiveGrossIncome,
    totalOperatingExpenses,
    netOperatingIncome,
    capRate,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCashReturn,
    loanAmount,
    monthlyDebtService,
    annualDebtService,
    totalInvestment,
    debtServiceCoverageRatio,
    noiPerLot,
    pricePerLot,
  };
}
