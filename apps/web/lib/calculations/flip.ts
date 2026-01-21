import type { FlipInputs, FlipResults } from '@dealforge/types';

/**
 * Main calculation function for Flip/Rehab analysis
 * Models a single-transaction investment: buy, rehab, sell for profit
 * This is a pure function designed for easy porting to Rust/WASM
 */
export function calculateFlipMetrics(inputs: FlipInputs): FlipResults {
  // === HOLDING COSTS ===
  const holdingCosts = inputs.holdingCostsMonthly * inputs.holdingPeriodMonths;

  // === FINANCING COSTS ===
  const loanAmount = inputs.useLoan ? (inputs.loanAmount ?? 0) : 0;
  const interestRate = inputs.useLoan ? (inputs.interestRate ?? 0) : 0;
  const pointsPercent = inputs.useLoan ? (inputs.pointsPercent ?? 0) : 0;

  const loanInterestCost = loanAmount * (interestRate / 100 / 12) * inputs.holdingPeriodMonths;
  const loanPointsCost = loanAmount * (pointsPercent / 100);
  const loanCosts = inputs.useLoan ? loanInterestCost + loanPointsCost : 0;

  // === SELLING COSTS ===
  const agentCommission = inputs.afterRepairValue * (inputs.agentCommissionPercent / 100);
  const sellingCosts = agentCommission + inputs.closingCostsSell;

  // === TOTAL COSTS ===
  const totalCosts =
    inputs.closingCostsBuy + inputs.rehabCosts + holdingCosts + loanCosts + sellingCosts;

  // === TOTAL CASH INVESTED ===
  const totalInvestment = inputs.useLoan
    ? inputs.purchasePrice -
      loanAmount +
      inputs.closingCostsBuy +
      inputs.rehabCosts +
      holdingCosts +
      loanCosts
    : inputs.purchasePrice + inputs.closingCostsBuy + inputs.rehabCosts + holdingCosts;

  // === PROFIT ===
  const grossProfit = inputs.afterRepairValue - inputs.purchasePrice - inputs.rehabCosts;
  const netProfit = inputs.afterRepairValue - inputs.purchasePrice - totalCosts;

  // === RETURNS ===
  const roi = totalInvestment > 0 ? (netProfit / totalInvestment) * 100 : 0;
  const annualizedRoi =
    inputs.holdingPeriodMonths > 0 ? (roi / inputs.holdingPeriodMonths) * 12 : 0;
  const profitMargin =
    inputs.afterRepairValue > 0 ? (netProfit / inputs.afterRepairValue) * 100 : 0;

  // === 70% RULE ===
  const maxAllowableOffer = inputs.afterRepairValue * 0.7 - inputs.rehabCosts;

  // === BREAK-EVEN ===
  const breakEvenPrice = inputs.purchasePrice + totalCosts;

  return {
    grossProfit,
    netProfit,
    roi,
    annualizedRoi,
    totalCosts,
    totalInvestment,
    breakEvenPrice,
    profitMargin,
    maxAllowableOffer,
  };
}
