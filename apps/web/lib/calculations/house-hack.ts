import type { HouseHackInputs, HouseHackResults } from '@dealforge/types';

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
 * Get the rent for a specific unit (1-indexed)
 */
function getUnitRent(inputs: HouseHackInputs, unitNumber: number): number {
  switch (unitNumber) {
    case 1:
      return inputs.unit1Rent;
    case 2:
      return inputs.unit2Rent;
    case 3:
      return inputs.unit3Rent;
    case 4:
      return inputs.unit4Rent;
    default:
      return 0;
  }
}

/**
 * Calculate total rent from all units
 */
function calculateGrossPotentialRent(inputs: HouseHackInputs): number {
  let total = inputs.unit1Rent + inputs.unit2Rent;
  if (inputs.numberOfUnits >= 3) total += inputs.unit3Rent;
  if (inputs.numberOfUnits >= 4) total += inputs.unit4Rent;
  return total;
}

/**
 * Calculate rental income from rented units only (excluding owner-occupied)
 */
function calculateRentalIncome(inputs: HouseHackInputs): number {
  let total = 0;
  for (let i = 1; i <= inputs.numberOfUnits; i++) {
    if (i !== inputs.ownerOccupiedUnit) {
      total += getUnitRent(inputs, i);
    }
  }
  return total;
}

/**
 * Main calculation function for house hack analysis
 */
export function calculateHouseHackMetrics(inputs: HouseHackInputs): HouseHackResults {
  // === PURCHASE & FINANCING ===
  const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.financingType === 'cash' ? 0 : inputs.purchasePrice - downPayment;
  const totalInvestment = downPayment + inputs.closingCosts + inputs.rehabCosts;

  // Mortgage calculation
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.loanTermYears * 12;
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, monthlyRate, numPayments);

  // PMI calculation (typically required if down payment < 20%)
  const requiresPmi =
    inputs.downPaymentPercent < 20 &&
    inputs.financingType !== 'cash' &&
    inputs.financingType !== 'va';
  const monthlyPmi = requiresPmi ? (loanAmount * (inputs.pmiRate / 100)) / 12 : 0;
  const totalMonthlyDebtService = monthlyMortgage + monthlyPmi;

  // === INCOME ANALYSIS ===
  const grossPotentialRent = calculateGrossPotentialRent(inputs);
  const rentalIncomeMonthly = calculateRentalIncome(inputs);
  const ownerUnitPotentialRent = getUnitRent(inputs, inputs.ownerOccupiedUnit);

  // Apply vacancy only to rented units
  const vacancyLoss = rentalIncomeMonthly * (inputs.vacancyRate / 100);
  const effectiveRentalIncome = rentalIncomeMonthly - vacancyLoss;

  // === OPERATING EXPENSES ===
  const monthlyPropertyTax = inputs.propertyTaxAnnual / 12;
  const monthlyInsurance = inputs.insuranceAnnual / 12;

  // Percentage-based expenses use gross potential rent as base
  const monthlyMaintenance = grossPotentialRent * (inputs.maintenancePercent / 100);
  const monthlyCapex = grossPotentialRent * (inputs.capexPercent / 100);
  const monthlyManagement = effectiveRentalIncome * (inputs.managementPercent / 100);

  const totalMonthlyExpenses =
    monthlyPropertyTax +
    monthlyInsurance +
    inputs.hoaMonthly +
    monthlyMaintenance +
    monthlyCapex +
    monthlyManagement +
    inputs.utilitiesMonthly;

  // === HOUSE HACK METRICS (The Key Numbers) ===
  // Gross monthly cost = debt service + operating expenses
  const grossMonthlyCost = totalMonthlyDebtService + totalMonthlyExpenses;

  // Net housing cost = what owner actually pays after rental income
  const netHousingCost = grossMonthlyCost - effectiveRentalIncome;

  // Savings compared to renting elsewhere
  const savingsVsRenting = inputs.equivalentRent - netHousingCost;

  // Effective housing cost (same as net housing cost, but floored at 0 for display)
  const effectiveHousingCost = Math.max(0, netHousingCost);

  // Lives for free if rental income covers all costs
  const livesForFree = netHousingCost <= 0;

  // === INVESTMENT METRICS (As If All Units Rented) ===
  // Calculate what happens if owner moves out and rents their unit
  const grossRentIfAllRented = grossPotentialRent;
  const vacancyIfAllRented = grossRentIfAllRented * (inputs.vacancyRate / 100);
  const effectiveIncomeIfAllRented = grossRentIfAllRented - vacancyIfAllRented;

  // Management expense if all rented
  const managementIfAllRented = effectiveIncomeIfAllRented * (inputs.managementPercent / 100);
  const totalExpensesIfAllRented =
    monthlyPropertyTax +
    monthlyInsurance +
    inputs.hoaMonthly +
    monthlyMaintenance +
    monthlyCapex +
    managementIfAllRented +
    inputs.utilitiesMonthly;

  // Net Operating Income (annual)
  const netOperatingIncome = (effectiveIncomeIfAllRented - totalExpensesIfAllRented) * 12;

  // Cash flow if owner moves out
  const cashFlowIfRented =
    effectiveIncomeIfAllRented - totalExpensesIfAllRented - totalMonthlyDebtService;
  const annualCashFlowIfRented = cashFlowIfRented * 12;

  // Cash on Cash Return (treating all units as rented)
  const cashOnCashIfRented =
    totalInvestment > 0 ? (annualCashFlowIfRented / totalInvestment) * 100 : 0;

  // Cap Rate
  const capRate = inputs.purchasePrice > 0 ? (netOperatingIncome / inputs.purchasePrice) * 100 : 0;

  // === BREAK-EVEN ANALYSIS ===
  // What rent would need to cover all costs?
  const breakEvenRent = grossMonthlyCost;

  // How much of costs are covered by current rental income?
  const rentCoverageRatio = grossMonthlyCost > 0 ? effectiveRentalIncome / grossMonthlyCost : 0;

  return {
    // Financing Summary
    loanAmount,
    monthlyMortgage,
    monthlyPmi,
    totalMonthlyDebtService,

    // Income Analysis
    grossPotentialRent,
    rentalIncomeMonthly,
    effectiveRentalIncome,
    ownerUnitPotentialRent,

    // Expense Breakdown
    monthlyPropertyTax,
    monthlyInsurance,
    monthlyMaintenance,
    monthlyCapex,
    monthlyManagement,
    totalMonthlyExpenses,

    // House Hack Metrics
    grossMonthlyCost,
    netHousingCost,
    savingsVsRenting,
    effectiveHousingCost,
    livesForFree,

    // Investment Metrics
    cashFlowIfRented,
    annualCashFlowIfRented,
    cashOnCashIfRented,
    capRate,
    netOperatingIncome,

    // Break-Even Analysis
    breakEvenRent,
    rentCoverageRatio,

    // Total Investment
    totalInvestment,
    downPayment,
  };
}
