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
 * Calculate Gross Potential Rent from unit mix
 */
function calculateGrossPotentialRent(inputs: MultifamilyInputs): number {
  const studioGPR = inputs.studioCount * inputs.studioRent * 12;
  const oneBedGPR = inputs.oneBedCount * inputs.oneBedRent * 12;
  const twoBedGPR = inputs.twoBedCount * inputs.twoBedRent * 12;
  const threeBedGPR = inputs.threeBedCount * inputs.threeBedRent * 12;

  return studioGPR + oneBedGPR + twoBedGPR + threeBedGPR;
}

/**
 * Calculate total unit count from unit mix
 */
function calculateTotalUnitsFromMix(inputs: MultifamilyInputs): number {
  return inputs.studioCount + inputs.oneBedCount + inputs.twoBedCount + inputs.threeBedCount;
}

/**
 * Calculate itemized operating expenses
 */
function calculateItemizedExpenses(inputs: MultifamilyInputs, egi: number): number {
  const managementFee = egi * (inputs.managementPercent / 100);
  const reserves = egi * (inputs.reservesPercent / 100);

  return (
    inputs.propertyTaxAnnual +
    inputs.insuranceAnnual +
    inputs.utilitiesAnnual +
    inputs.repairsMaintenanceAnnual +
    managementFee +
    inputs.payrollAnnual +
    inputs.advertisingAnnual +
    inputs.legalAccountingAnnual +
    inputs.landscapingAnnual +
    inputs.contractServicesAnnual +
    reserves
  );
}

/**
 * Main calculation function for multi-family property analysis
 */
export function calculateMultifamilyMetrics(inputs: MultifamilyInputs): MultifamilyResults {
  // === INCOME ANALYSIS ===
  // Gross Potential Rent (annual)
  const grossPotentialRent = calculateGrossPotentialRent(inputs);
  const grossPotentialRentMonthly = grossPotentialRent / 12;

  // Other Income (annualized)
  const otherIncomeAnnual =
    (inputs.laundryIncome +
      inputs.parkingIncome +
      inputs.storageIncome +
      inputs.petFees +
      inputs.otherIncome) *
    12;

  // Gross Potential Income
  const grossPotentialIncome = grossPotentialRent + otherIncomeAnnual;

  // Vacancy & Credit Loss
  const vacancyLoss = grossPotentialRent * (inputs.vacancyRate / 100);
  const creditLoss = grossPotentialRent * (inputs.creditLossRate / 100);

  // Effective Gross Income
  const effectiveGrossIncome = grossPotentialIncome - vacancyLoss - creditLoss;
  const effectiveGrossIncomeMonthly = effectiveGrossIncome / 12;

  // === EXPENSE ANALYSIS ===
  let totalOperatingExpenses: number;

  if (inputs.useExpenseRatio) {
    // Use expense ratio method
    totalOperatingExpenses = effectiveGrossIncome * (inputs.expenseRatio / 100);
  } else {
    // Use itemized expenses
    totalOperatingExpenses = calculateItemizedExpenses(inputs, effectiveGrossIncome);
  }

  const totalOperatingExpensesMonthly = totalOperatingExpenses / 12;

  // Actual expense ratio (for display regardless of method used)
  const expenseRatioActual =
    effectiveGrossIncome > 0 ? (totalOperatingExpenses / effectiveGrossIncome) * 100 : 0;

  // === NET OPERATING INCOME ===
  const netOperatingIncome = effectiveGrossIncome - totalOperatingExpenses;
  const netOperatingIncomeMonthly = netOperatingIncome / 12;

  // === FINANCING ===
  const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPayment;
  const closingCosts = inputs.purchasePrice * (inputs.closingCostsPercent / 100);
  const loanPoints = loanAmount * (inputs.loanPointsPercent / 100);
  const totalInvestment = downPayment + closingCosts + loanPoints;

  // Mortgage calculation (using amortization period, not loan term)
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.amortizationYears * 12;
  const monthlyDebtService = calculateMonthlyPayment(loanAmount, monthlyRate, numPayments);
  const annualDebtService = monthlyDebtService * 12;

  // === KEY METRICS ===
  // Cap Rate (Purchase)
  const capRatePurchase =
    inputs.purchasePrice > 0 ? (netOperatingIncome / inputs.purchasePrice) * 100 : 0;

  // Cap Rate (Market) - using input market cap rate
  const capRateMarket = inputs.marketCapRate;

  // Debt Service Coverage Ratio
  const debtServiceCoverageRatio =
    annualDebtService > 0 ? netOperatingIncome / annualDebtService : 0;

  // Cash Flow
  const annualCashFlow = netOperatingIncome - annualDebtService;
  const monthlyCashFlow = annualCashFlow / 12;

  // Cash on Cash Return
  const cashOnCashReturn = totalInvestment > 0 ? (annualCashFlow / totalInvestment) * 100 : 0;

  // === VALUATION METRICS ===
  const totalUnits = calculateTotalUnitsFromMix(inputs) || inputs.totalUnits;

  // Price per unit
  const pricePerUnit = totalUnits > 0 ? inputs.purchasePrice / totalUnits : 0;

  // Price per sq ft
  const pricePerSqFt = inputs.squareFootage > 0 ? inputs.purchasePrice / inputs.squareFootage : 0;

  // Gross Rent Multiplier
  const grossRentMultiplier =
    grossPotentialRent > 0 ? inputs.purchasePrice / grossPotentialRent : 0;

  // Estimated Market Value (based on market cap rate)
  const estimatedMarketValue =
    inputs.marketCapRate > 0 ? netOperatingIncome / (inputs.marketCapRate / 100) : 0;

  // === BREAK-EVEN ANALYSIS ===
  // Break-even occupancy: What % occupancy covers expenses + debt service?
  // At break-even: GPR * occupancy + other income - vacancy/credit = expenses + debt service
  // Simplified: (GPR * occupancy) = expenses + debt service - other income + vacancy/credit adjustments
  const totalCostsTocover = totalOperatingExpenses + annualDebtService;
  const breakEvenOccupancy =
    grossPotentialRent > 0 ? (totalCostsTocover / grossPotentialRent) * 100 : 0;

  // Break-even rent per unit
  const breakEvenRentPerUnit = totalUnits > 0 ? totalCostsTocover / 12 / totalUnits : 0;

  // === PER UNIT ANALYSIS ===
  const noiPerUnit = totalUnits > 0 ? netOperatingIncome / totalUnits : 0;
  const expensesPerUnit = totalUnits > 0 ? totalOperatingExpenses / totalUnits : 0;
  const rentPerUnit = totalUnits > 0 ? grossPotentialRent / 12 / totalUnits : 0;

  return {
    // Income Analysis
    grossPotentialRent,
    grossPotentialRentMonthly,
    otherIncomeAnnual,
    grossPotentialIncome,
    vacancyLoss,
    creditLoss,
    effectiveGrossIncome,
    effectiveGrossIncomeMonthly,

    // Expense Analysis
    totalOperatingExpenses,
    totalOperatingExpensesMonthly,
    expenseRatioActual,

    // Net Operating Income
    netOperatingIncome,
    netOperatingIncomeMonthly,

    // Financing
    loanAmount,
    downPayment,
    closingCosts,
    loanPoints,
    totalInvestment,
    monthlyDebtService,
    annualDebtService,

    // Key Metrics
    capRatePurchase,
    capRateMarket,
    debtServiceCoverageRatio,
    cashOnCashReturn,
    monthlyCashFlow,
    annualCashFlow,

    // Valuation Metrics
    pricePerUnit,
    pricePerSqFt,
    grossRentMultiplier,
    estimatedMarketValue,

    // Break-Even Analysis
    breakEvenOccupancy,
    breakEvenRentPerUnit,

    // Per Unit Analysis
    noiPerUnit,
    expensesPerUnit,
    rentPerUnit,
  };
}
