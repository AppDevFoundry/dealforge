import type { MhParkCalculatorInputs, MhParkCalculatorResults } from '@dealforge/types';

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
 * Main calculation function for MH Park analysis
 *
 * This calculator follows the simplified park valuation model:
 * - Lot rent × lots = Gross Potential Rent
 * - Apply vacancy (based on occupancy)
 * - Apply expense ratio
 * - Calculate NOI and key metrics
 */
export function calculateMhParkMetrics(inputs: MhParkCalculatorInputs): MhParkCalculatorResults {
  // === OCCUPANCY ===
  const occupancyRate =
    inputs.lotCount > 0 ? (inputs.occupiedLots / inputs.lotCount) * 100 : 0;

  // === INCOME ANALYSIS ===
  // Gross Potential Rent (annual) - if all lots were rented
  const grossPotentialRent = inputs.lotCount * inputs.avgLotRent * 12;

  // Vacancy loss based on unoccupied lots
  const vacancyLoss = (inputs.lotCount - inputs.occupiedLots) * inputs.avgLotRent * 12;

  // Other income (annualized) - laundry, late fees, app fees, etc.
  const otherIncomeAnnual = inputs.otherIncomeMonthly * 12;

  // Effective Gross Income
  const effectiveGrossIncome = grossPotentialRent - vacancyLoss + otherIncomeAnnual;

  // === EXPENSE ANALYSIS ===
  // Total Operating Expenses (using expense ratio method)
  const totalOperatingExpenses = effectiveGrossIncome * (inputs.expenseRatioPercent / 100);

  // === NET OPERATING INCOME ===
  const netOperatingIncome = effectiveGrossIncome - totalOperatingExpenses;
  const noiPerLot = inputs.lotCount > 0 ? netOperatingIncome / inputs.lotCount : 0;

  // === FINANCING ===
  const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPayment;
  const closingCosts = inputs.purchasePrice * (inputs.closingCostsPercent / 100);
  const totalInvestment = downPayment + closingCosts;

  // Mortgage calculation
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.loanTermYears * 12;
  const monthlyDebtService = calculateMonthlyPayment(loanAmount, monthlyRate, numPayments);
  const annualDebtService = monthlyDebtService * 12;

  // === KEY METRICS ===
  // Cap Rate
  const capRate =
    inputs.purchasePrice > 0 ? (netOperatingIncome / inputs.purchasePrice) * 100 : 0;

  // Debt Service Coverage Ratio
  const debtServiceCoverageRatio =
    annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;

  // Cash Flow
  const annualCashFlow = netOperatingIncome - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  // Cash on Cash Return
  const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;

  // === VALUATION METRICS ===
  // Price per Lot
  const pricePerLot = inputs.lotCount > 0 ? inputs.purchasePrice / inputs.lotCount : 0;

  // Gross Rent Multiplier
  const grossRentMultiplier =
    grossPotentialRent > 0 ? inputs.purchasePrice / grossPotentialRent : 0;

  // Estimated Market Value (based on market cap rate)
  const estimatedMarketValue =
    inputs.marketCapRate > 0 ? netOperatingIncome / (inputs.marketCapRate / 100) : 0;

  return {
    // Occupancy
    occupancyRate,

    // Income Analysis
    grossPotentialRent,
    effectiveGrossIncome,
    vacancyLoss,
    otherIncomeAnnual,

    // Expense Analysis
    totalOperatingExpenses,

    // Net Operating Income
    netOperatingIncome,
    noiPerLot,

    // Financing
    loanAmount,
    downPayment,
    closingCosts,
    totalInvestment,
    monthlyDebtService,
    annualDebtService,

    // Key Metrics
    capRate,
    cashOnCashReturn,
    debtServiceCoverageRatio,

    // Cash Flow
    monthlyCashFlow,
    annualCashFlow,

    // Valuation
    pricePerLot,
    estimatedMarketValue,
    grossRentMultiplier,
  };
}
