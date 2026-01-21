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
 * Get the total monthly rent from non-owner-occupied units
 */
function getTenantRent(inputs: HouseHackInputs): number {
  const rents = [inputs.unit1Rent, inputs.unit2Rent, inputs.unit3Rent, inputs.unit4Rent];
  let total = 0;
  for (let i = 0; i < inputs.numberOfUnits; i++) {
    if (i + 1 !== inputs.ownerUnit) {
      total += rents[i] ?? 0;
    }
  }
  return total;
}

/**
 * Main calculation function for House Hack analysis
 * Models an owner-occupied multi-unit property where tenants offset housing costs
 * This is a pure function designed for easy porting to Rust/WASM
 */
export function calculateHouseHackMetrics(inputs: HouseHackInputs): HouseHackResults {
  // === FINANCING ===
  const downPayment = inputs.purchasePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = inputs.purchasePrice - downPayment;
  const monthlyRate = inputs.interestRate / 100 / 12;
  const numPayments = inputs.loanTermYears * 12;
  const monthlyMortgage = calculateMonthlyPayment(loanAmount, monthlyRate, numPayments);

  // === TOTAL INVESTMENT ===
  const totalInvestment = downPayment + inputs.closingCosts;

  // === RENTAL INCOME (owner-occupied scenario) ===
  const totalMonthlyRent = getTenantRent(inputs);
  const vacancyLoss = totalMonthlyRent * (inputs.vacancyRate / 100);
  const effectiveRentalIncome = totalMonthlyRent - vacancyLoss;

  // === OPERATING EXPENSES ===
  const monthlyPropertyTax = inputs.propertyTaxAnnual / 12;
  const monthlyInsurance = inputs.insuranceAnnual / 12;
  const maintenanceExpense = totalMonthlyRent * (inputs.maintenancePercent / 100);
  const capexExpense = totalMonthlyRent * (inputs.capexPercent / 100);

  const totalMonthlyExpenses =
    monthlyPropertyTax + monthlyInsurance + inputs.hoaMonthly + maintenanceExpense + capexExpense;

  // === KEY METRICS (owner-occupied) ===
  const netHousingCost = monthlyMortgage + totalMonthlyExpenses - effectiveRentalIncome;
  const effectiveHousingCost = netHousingCost;
  const savingsVsRenting = inputs.ownerEquivalentRent - netHousingCost;

  // === ALL-RENTED SCENARIO (if/when owner moves out) ===
  const rents = [inputs.unit1Rent, inputs.unit2Rent, inputs.unit3Rent, inputs.unit4Rent];
  let allUnitsRent = 0;
  for (let i = 0; i < inputs.numberOfUnits; i++) {
    if (i + 1 === inputs.ownerUnit) {
      allUnitsRent += inputs.ownerEquivalentRent;
    } else {
      allUnitsRent += rents[i] ?? 0;
    }
  }
  const allRentedVacancy = allUnitsRent * (inputs.vacancyRate / 100);
  const allRentedEffective = allUnitsRent - allRentedVacancy;
  const allRentedMaintenance = allUnitsRent * (inputs.maintenancePercent / 100);
  const allRentedCapex = allUnitsRent * (inputs.capexPercent / 100);
  const allRentedManagement = allUnitsRent * (inputs.managementPercent / 100);
  const allRentedExpenses =
    monthlyPropertyTax +
    monthlyInsurance +
    inputs.hoaMonthly +
    allRentedMaintenance +
    allRentedCapex +
    allRentedManagement;
  const cashFlowAllRented = allRentedEffective - allRentedExpenses - monthlyMortgage;

  // === RETURNS ===
  const annualCashFlowAllRented = cashFlowAllRented * 12;
  const cashOnCashReturn =
    totalInvestment > 0 ? (annualCashFlowAllRented / totalInvestment) * 100 : 0;

  // === BREAK-EVEN ===
  // Minimum gross rent needed from tenants to make net housing cost = 0
  const effectiveRentFactor = 1 - inputs.vacancyRate / 100;
  const breakEvenRent =
    effectiveRentFactor > 0
      ? (monthlyMortgage + totalMonthlyExpenses) / effectiveRentFactor
      : monthlyMortgage + totalMonthlyExpenses;

  return {
    netHousingCost,
    savingsVsRenting,
    effectiveHousingCost,
    cashFlowAllRented,
    cashOnCashReturn,
    totalMonthlyRent,
    monthlyMortgage,
    totalMonthlyExpenses,
    totalInvestment,
    loanAmount,
    breakEvenRent,
  };
}
