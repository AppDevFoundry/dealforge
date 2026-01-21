import type { FlipInputs, FlipResults } from '@dealforge/types';

/**
 * Calculate monthly interest-only payment
 */
function calculateMonthlyInterestPayment(principal: number, annualRate: number): number {
  if (principal <= 0 || annualRate <= 0) return 0;
  return principal * (annualRate / 100 / 12);
}

/**
 * Main calculation function for fix-and-flip property analysis
 * Calculates profit projections, ROI, and the 70% rule check
 */
export function calculateFlipMetrics(inputs: FlipInputs): FlipResults {
  // === PURCHASE COSTS ===
  const closingCostsBuy = inputs.purchasePrice * (inputs.closingCostsBuyPercent / 100);
  const totalAcquisitionCost = inputs.purchasePrice + closingCostsBuy + inputs.rehabCosts;

  // === FINANCING ===
  let loanAmount = 0;
  let downPayment = inputs.purchasePrice;
  let loanPoints = 0;
  let monthlyLoanPayment = 0;
  let totalLoanInterest = 0;

  if (inputs.useLoan && inputs.loanToValuePercent > 0) {
    // Calculate loan amount based on LTV
    const purchaseLoan = inputs.purchasePrice * (inputs.loanToValuePercent / 100);
    const rehabLoan = inputs.includeRehabInLoan ? inputs.rehabCosts : 0;
    loanAmount = purchaseLoan + rehabLoan;

    // Down payment is the difference
    downPayment = inputs.purchasePrice - purchaseLoan;
    if (!inputs.includeRehabInLoan) {
      // If rehab not financed, it's part of cash required
      downPayment += inputs.rehabCosts;
    }

    // Loan points (origination fee)
    loanPoints = loanAmount * (inputs.loanPointsPercent / 100);

    // Interest-only monthly payment (typical for hard money/flip loans)
    monthlyLoanPayment = calculateMonthlyInterestPayment(loanAmount, inputs.loanInterestRate);

    // Total interest over holding period
    totalLoanInterest = monthlyLoanPayment * inputs.holdingPeriodMonths;
  }

  // === HOLDING COSTS ===
  const totalHoldingCosts =
    inputs.holdingCostsMonthly * inputs.holdingPeriodMonths + totalLoanInterest;

  // === SELLING COSTS ===
  const agentCommission = inputs.afterRepairValue * (inputs.agentCommissionPercent / 100);
  const closingCostsSell = inputs.afterRepairValue * (inputs.closingCostsSellPercent / 100);
  const totalSellingCosts = agentCommission + closingCostsSell;

  // === TOTAL COSTS ===
  const totalProjectCost =
    inputs.purchasePrice +
    closingCostsBuy +
    inputs.rehabCosts +
    loanPoints +
    totalHoldingCosts +
    totalSellingCosts;

  // Total cash required (what investor needs out of pocket)
  const totalCashRequired = inputs.useLoan
    ? downPayment +
      closingCostsBuy +
      loanPoints +
      inputs.holdingCostsMonthly * inputs.holdingPeriodMonths
    : totalAcquisitionCost + inputs.holdingCostsMonthly * inputs.holdingPeriodMonths;

  // === PROFIT METRICS ===
  // Gross profit = ARV - Purchase Price - Rehab
  const grossProfit = inputs.afterRepairValue - inputs.purchasePrice - inputs.rehabCosts;

  // Net profit = ARV - All Costs
  const netProfit = inputs.afterRepairValue - totalProjectCost;

  // Profit margin = Net Profit / ARV
  const profitMargin =
    inputs.afterRepairValue > 0 ? (netProfit / inputs.afterRepairValue) * 100 : 0;

  // ROI = Net Profit / Total Cash Required
  const roi = totalCashRequired > 0 ? (netProfit / totalCashRequired) * 100 : 0;

  // Annualized ROI = ROI * (12 / Holding Period)
  const annualizedRoi =
    inputs.holdingPeriodMonths > 0 ? roi * (12 / inputs.holdingPeriodMonths) : 0;

  // === ANALYSIS ===
  // Break-even price = Total Project Cost (excluding selling costs that scale with price)
  // This is the minimum sale price to not lose money
  const fixedCosts =
    inputs.purchasePrice + closingCostsBuy + inputs.rehabCosts + loanPoints + totalHoldingCosts;
  // Break-even: Sale Price - Commission - Closing = Fixed Costs
  // Sale Price * (1 - commission% - closing%) = Fixed Costs
  const sellingCostPercent = (inputs.agentCommissionPercent + inputs.closingCostsSellPercent) / 100;
  const breakEvenPrice =
    sellingCostPercent < 1 ? fixedCosts / (1 - sellingCostPercent) : fixedCosts;

  // 70% Rule: Maximum Allowable Offer = ARV × 0.70 - Rehab Costs
  const maxAllowableOffer = inputs.afterRepairValue * 0.7 - inputs.rehabCosts;

  // Check if the deal meets the 70% rule
  const dealMeetsSeventyPercentRule = inputs.purchasePrice <= maxAllowableOffer;

  return {
    // Purchase Costs
    closingCostsBuy,
    totalAcquisitionCost,

    // Financing Details
    loanAmount,
    downPayment,
    loanPoints,
    monthlyLoanPayment,
    totalLoanInterest,

    // Holding Costs
    totalHoldingCosts,

    // Selling Costs
    agentCommission,
    closingCostsSell,
    totalSellingCosts,

    // Total Costs
    totalProjectCost,
    totalCashRequired,

    // Profit Metrics
    grossProfit,
    netProfit,
    profitMargin,
    roi,
    annualizedRoi,

    // Analysis
    breakEvenPrice,
    maxAllowableOffer,
    dealMeetsSeventyPercentRule,
  };
}
