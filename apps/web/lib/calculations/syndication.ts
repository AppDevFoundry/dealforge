import type { SyndicationInputs, SyndicationResults, YearlyProjection } from '@dealforge/types';

/**
 * Calculate IRR using Newton-Raphson method
 * @param cashFlows Array of cash flows (negative for outflows, positive for inflows)
 * @returns IRR as a percentage (e.g., 15 for 15%)
 */
function calculateIRR(cashFlows: number[], maxIterations = 100, tolerance = 0.0001): number {
  if (cashFlows.length < 2) return 0;

  // Check if all cash flows are zero or same sign (no IRR possible)
  const hasNegative = cashFlows.some((cf) => cf < 0);
  const hasPositive = cashFlows.some((cf) => cf > 0);
  if (!hasNegative || !hasPositive) return 0;

  // NPV calculation at a given rate
  const npv = (rate: number): number => {
    return cashFlows.reduce((sum, cf, i) => sum + cf / (1 + rate) ** i, 0);
  };

  // NPV derivative
  const npvDerivative = (rate: number): number => {
    return cashFlows.reduce((sum, cf, i) => {
      if (i === 0) return sum;
      return sum - (i * cf) / (1 + rate) ** (i + 1);
    }, 0);
  };

  // Initial guess
  let rate = 0.1;

  for (let i = 0; i < maxIterations; i++) {
    const npvValue = npv(rate);
    const derivative = npvDerivative(rate);

    if (Math.abs(derivative) < 1e-10) {
      // Try a different starting point
      rate = rate + 0.1;
      continue;
    }

    const newRate = rate - npvValue / derivative;

    // Bound the rate to reasonable values
    if (newRate < -0.99) {
      rate = -0.5;
      continue;
    }
    if (newRate > 10) {
      rate = 2;
      continue;
    }

    if (Math.abs(newRate - rate) < tolerance) {
      return newRate * 100; // Return as percentage
    }

    rate = newRate;
  }

  // If Newton-Raphson didn't converge, try bisection method
  let low = -0.99;
  let high = 5;

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const npvMid = npv(mid);

    if (Math.abs(npvMid) < tolerance || (high - low) / 2 < tolerance) {
      return mid * 100;
    }

    if (npv(low) * npvMid < 0) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return rate * 100;
}

/**
 * Calculate monthly mortgage payment using standard amortization formula
 */
function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  years: number,
  interestOnly = false
): number {
  if (principal <= 0) return 0;
  if (interestOnly) {
    return principal * (annualRate / 100 / 12);
  }

  const monthlyRate = annualRate / 100 / 12;
  const numPayments = years * 12;

  if (monthlyRate === 0) return principal / numPayments;

  return (
    (principal * (monthlyRate * (1 + monthlyRate) ** numPayments)) /
    ((1 + monthlyRate) ** numPayments - 1)
  );
}

/**
 * Calculate remaining loan balance after a number of years
 */
function calculateRemainingBalance(
  principal: number,
  annualRate: number,
  amortYears: number,
  yearsElapsed: number,
  interestOnly = false,
  ioYears = 0
): number {
  if (principal <= 0) return 0;
  if (interestOnly && yearsElapsed <= ioYears) return principal;

  const monthlyRate = annualRate / 100 / 12;
  const totalPayments = amortYears * 12;

  // Adjust for interest-only period
  const amortizingYears = interestOnly ? yearsElapsed - ioYears : yearsElapsed;
  if (amortizingYears <= 0) return principal;

  const paymentsMade = Math.min(amortizingYears * 12, totalPayments);

  if (monthlyRate === 0) {
    return principal - (principal / totalPayments) * paymentsMade;
  }

  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, amortYears, false);

  // Remaining balance formula
  const balance =
    principal * (1 + monthlyRate) ** paymentsMade -
    monthlyPayment * (((1 + monthlyRate) ** paymentsMade - 1) / monthlyRate);

  return Math.max(0, balance);
}

/**
 * Distribute cash flow through the waterfall structure
 */
function distributeWaterfall(
  availableCash: number,
  lpEquity: number,
  lpCumulativeDistributions: number,
  inputs: SyndicationInputs,
  isExitYear: boolean
): { lpShare: number; gpShare: number } {
  if (availableCash <= 0) {
    return { lpShare: 0, gpShare: 0 };
  }

  let remaining = availableCash;
  let lpShare = 0;
  let gpShare = 0;

  // Step 1: Return of capital to LPs (only on exit)
  if (isExitYear) {
    const lpCapitalOutstanding = Math.max(0, lpEquity - lpCumulativeDistributions);
    const returnOfCapital = Math.min(remaining, lpCapitalOutstanding);
    lpShare += returnOfCapital;
    remaining -= returnOfCapital;
  }

  // Step 2: Preferred return to LPs
  const annualPref = lpEquity * (inputs.preferredReturn / 100);
  const prefPayment = Math.min(remaining, annualPref);
  lpShare += prefPayment;
  remaining -= prefPayment;

  if (remaining <= 0) {
    return { lpShare, gpShare };
  }

  // Step 3: Tier 1 split (after pref, before first IRR hurdle)
  // For simplicity, apply tier 1 split to remaining
  const tier1Split = remaining;
  lpShare += tier1Split * (inputs.tier1LpSplit / 100);
  gpShare += tier1Split * (inputs.tier1GpSplit / 100);

  return { lpShare, gpShare };
}

/**
 * Calculate full waterfall distribution at exit with IRR hurdles
 */
function calculateExitWaterfall(
  totalDistributable: number,
  lpEquity: number,
  gpEquity: number,
  lpCumulativeDistributions: number,
  gpCumulativeDistributions: number,
  lpCashFlows: number[],
  _gpCashFlows: number[],
  inputs: SyndicationInputs
): { lpShare: number; gpShare: number; promote: number } {
  let remaining = totalDistributable;
  let lpShare = 0;
  let gpShare = 0;
  let promote = 0;

  // Step 1: Return of capital
  const lpCapitalOutstanding = Math.max(0, lpEquity - lpCumulativeDistributions);
  const gpCapitalOutstanding = Math.max(0, gpEquity - gpCumulativeDistributions);

  const lpCapitalReturn = Math.min(remaining, lpCapitalOutstanding);
  lpShare += lpCapitalReturn;
  remaining -= lpCapitalReturn;

  if (remaining <= 0) return { lpShare, gpShare, promote };

  const gpCapitalReturn = Math.min(remaining, gpCapitalOutstanding);
  gpShare += gpCapitalReturn;
  remaining -= gpCapitalReturn;

  if (remaining <= 0) return { lpShare, gpShare, promote };

  // Step 2: Catch-up preferred return (accrued unpaid pref)
  const totalPrefDue = lpEquity * (inputs.preferredReturn / 100) * inputs.holdPeriodYears;
  const prefPaid = lpCumulativeDistributions - lpEquity + lpCapitalReturn;
  const prefCatchUp = Math.max(0, Math.min(remaining, totalPrefDue - prefPaid));
  lpShare += prefCatchUp;
  remaining -= prefCatchUp;

  if (remaining <= 0) return { lpShare, gpShare, promote };

  // Step 3: Split remaining based on IRR hurdles achieved
  // Calculate what IRR would be at each tier
  const testLpCashFlows = [...lpCashFlows, lpShare + remaining];
  const potentialLpIrr = calculateIRR(testLpCashFlows);

  // Determine which tier we're in based on IRR
  let lpSplit: number;
  let gpSplit: number;

  if (potentialLpIrr >= inputs.tier3IrrHurdle && inputs.tier3IrrHurdle > 0) {
    lpSplit = inputs.tier3LpSplit;
    gpSplit = inputs.tier3GpSplit;
  } else if (potentialLpIrr >= inputs.tier2IrrHurdle && inputs.tier2IrrHurdle > 0) {
    lpSplit = inputs.tier2LpSplit;
    gpSplit = inputs.tier2GpSplit;
  } else {
    lpSplit = inputs.tier1LpSplit;
    gpSplit = inputs.tier1GpSplit;
  }

  const lpAdditional = remaining * (lpSplit / 100);
  const gpAdditional = remaining * (gpSplit / 100);

  lpShare += lpAdditional;
  gpShare += gpAdditional;

  // Calculate promote (GP distributions above their pro-rata share)
  const gpProRataShare = totalDistributable * (gpEquity / (lpEquity + gpEquity));
  promote = Math.max(0, gpShare - gpProRataShare);

  return { lpShare, gpShare, promote };
}

/**
 * Main calculation function for syndication analysis
 */
export function calculateSyndicationMetrics(inputs: SyndicationInputs): SyndicationResults {
  // === CAPITALIZATION ===
  const totalCapitalization =
    inputs.totalCapitalization > 0
      ? inputs.totalCapitalization
      : inputs.purchasePrice + inputs.closingCosts + inputs.capexReserves;

  const loanAmount = inputs.purchasePrice * (inputs.loanToValue / 100);
  const totalEquity = totalCapitalization - loanAmount;
  const lpEquity = totalEquity * (inputs.lpEquityPercent / 100);
  const gpEquity = totalEquity * (inputs.gpEquityPercent / 100);

  // === FEES ===
  const acquisitionFee = inputs.purchasePrice * (inputs.acquisitionFeePercent / 100);
  const annualAssetMgmtFee = totalEquity * (inputs.assetManagementFeePercent / 100);
  const totalAssetManagementFees = annualAssetMgmtFee * inputs.holdPeriodYears;

  // === YEAR-BY-YEAR PROJECTIONS ===
  const yearlyProjections: YearlyProjection[] = [];
  let cumulativeLpDistributions = 0;
  let cumulativeGpDistributions = 0;
  let totalNoiOverHold = 0;

  // Track cash flows for IRR calculation
  const lpCashFlows: number[] = [-lpEquity]; // Initial investment (negative)
  const gpCashFlows: number[] = [-gpEquity + acquisitionFee]; // Initial investment minus acquisition fee

  for (let year = 1; year <= inputs.holdPeriodYears; year++) {
    // Calculate NOI for this year with growth
    const growthFactor = (1 + inputs.rentGrowthRate / 100) ** (year - 1);
    const expenseGrowthFactor = (1 + inputs.expenseGrowthRate / 100) ** (year - 1);

    const gpr = inputs.grossPotentialRent * growthFactor;
    const vacancy = gpr * (inputs.vacancyRate / 100);
    const otherIncome = inputs.otherIncome * growthFactor;
    const egi = gpr - vacancy + otherIncome;

    const baseExpenses = inputs.grossPotentialRent * (inputs.operatingExpenseRatio / 100);
    const expenses = baseExpenses * expenseGrowthFactor;
    const noi = egi - expenses;
    totalNoiOverHold += noi;

    // Calculate debt service
    const isIO = inputs.interestOnly && year <= inputs.interestOnlyYears;
    const monthlyPayment = isIO
      ? calculateMonthlyPayment(loanAmount, inputs.interestRate, inputs.amortizationYears, true)
      : calculateMonthlyPayment(loanAmount, inputs.interestRate, inputs.amortizationYears, false);
    const annualDebtService = monthlyPayment * 12;

    // Cash flow before distributions
    const cashFlowBeforeDebt = noi - annualAssetMgmtFee;
    const cashFlowAfterDebt = cashFlowBeforeDebt - annualDebtService;

    // Distribute through waterfall
    const { lpShare, gpShare } = distributeWaterfall(
      Math.max(0, cashFlowAfterDebt),
      lpEquity,
      cumulativeLpDistributions,
      inputs,
      false // Not exit year for operating distributions
    );

    cumulativeLpDistributions += lpShare;
    cumulativeGpDistributions += gpShare + annualAssetMgmtFee; // GP also gets asset mgmt fee

    // Add to cash flows for IRR
    lpCashFlows.push(lpShare);
    gpCashFlows.push(gpShare + annualAssetMgmtFee);

    yearlyProjections.push({
      year,
      noi,
      cashFlowBeforeDebt,
      debtService: annualDebtService,
      cashFlowAfterDebt,
      lpDistribution: lpShare,
      gpDistribution: gpShare + annualAssetMgmtFee,
      cumulativeLpDistributions,
      cumulativeGpDistributions,
    });
  }

  // === EXIT ANALYSIS ===
  const exitYear = inputs.holdPeriodYears;
  const exitNoi = yearlyProjections[exitYear - 1]?.noi || 0;
  // Project NOI one more year for exit valuation
  const exitNoiForValuation = exitNoi * (1 + inputs.rentGrowthRate / 100);
  const exitValue = inputs.exitCapRate > 0 ? exitNoiForValuation / (inputs.exitCapRate / 100) : 0;
  const dispositionCosts = exitValue * (inputs.dispositionFeePercent / 100);
  const loanPayoff = calculateRemainingBalance(
    loanAmount,
    inputs.interestRate,
    inputs.amortizationYears,
    inputs.holdPeriodYears,
    inputs.interestOnly,
    inputs.interestOnlyYears
  );
  const netSaleProceeds = exitValue - dispositionCosts - loanPayoff;
  const equityAtSale = exitValue - loanPayoff;

  // === EXIT WATERFALL DISTRIBUTION ===
  const {
    lpShare: lpSaleShare,
    gpShare: gpSaleShare,
    promote,
  } = calculateExitWaterfall(
    Math.max(0, netSaleProceeds),
    lpEquity,
    gpEquity,
    cumulativeLpDistributions,
    cumulativeGpDistributions - totalAssetManagementFees, // Exclude asset mgmt fees from capital calc
    lpCashFlows,
    gpCashFlows,
    inputs
  );

  // Add exit distributions to cash flows (modify last element to include exit proceeds)
  const lpLastIdx = lpCashFlows.length - 1;
  const gpLastIdx = gpCashFlows.length - 1;
  const lpLastValue = lpCashFlows[lpLastIdx];
  const gpLastValue = gpCashFlows[gpLastIdx];
  if (lpLastIdx >= 0 && lpLastValue !== undefined) {
    lpCashFlows[lpLastIdx] = lpLastValue + lpSaleShare;
  }
  if (gpLastIdx >= 0 && gpLastValue !== undefined) {
    gpCashFlows[gpLastIdx] = gpLastValue + gpSaleShare;
  }

  // === FINAL CALCULATIONS ===
  const lpTotalDistributions = cumulativeLpDistributions + lpSaleShare;
  const gpTotalDistributions = cumulativeGpDistributions + gpSaleShare;

  const lpEquityMultiple = lpEquity > 0 ? lpTotalDistributions / lpEquity : 0;
  const gpEquityMultiple = gpEquity > 0 ? gpTotalDistributions / gpEquity : 0;

  const lpIrr = calculateIRR(lpCashFlows);
  const gpIrr = calculateIRR(gpCashFlows);

  // Preferred return total
  const lpPreferredReturnTotal = Math.min(
    cumulativeLpDistributions,
    lpEquity * (inputs.preferredReturn / 100) * inputs.holdPeriodYears
  );

  // Going-in cap rate
  const year1Noi = yearlyProjections[0]?.noi || 0;
  const goingInCapRate = inputs.purchasePrice > 0 ? (year1Noi / inputs.purchasePrice) * 100 : 0;

  // Average cash on cash
  const totalCashFlow = yearlyProjections.reduce((sum, y) => sum + y.cashFlowAfterDebt, 0);
  const averageCashOnCash =
    totalEquity > 0 ? (totalCashFlow / inputs.holdPeriodYears / totalEquity) * 100 : 0;

  // Total profit
  const totalProfitOverHold = lpTotalDistributions + gpTotalDistributions - totalEquity;

  // === SENSITIVITY ANALYSIS ===
  const sensitivityAnalysis = [];
  const exitCapRates = [
    inputs.exitCapRate - 1,
    inputs.exitCapRate - 0.5,
    inputs.exitCapRate,
    inputs.exitCapRate + 0.5,
    inputs.exitCapRate + 1,
  ].filter((rate) => rate > 0);

  for (const capRate of exitCapRates) {
    const sensExitValue = exitNoiForValuation / (capRate / 100);
    const sensDisposition = sensExitValue * (inputs.dispositionFeePercent / 100);
    const sensNetProceeds = sensExitValue - sensDisposition - loanPayoff;

    const sensWaterfall = calculateExitWaterfall(
      Math.max(0, sensNetProceeds),
      lpEquity,
      gpEquity,
      cumulativeLpDistributions,
      cumulativeGpDistributions - totalAssetManagementFees,
      lpCashFlows.slice(0, -1),
      gpCashFlows.slice(0, -1),
      inputs
    );

    const sensLpTotal = cumulativeLpDistributions + sensWaterfall.lpShare;
    const sensGpTotal = cumulativeGpDistributions + sensWaterfall.gpShare;

    const sensLpLastValue = lpCashFlows[lpCashFlows.length - 1] ?? 0;
    const sensGpLastValue = gpCashFlows[gpCashFlows.length - 1] ?? 0;
    const sensLpCashFlows = [
      ...lpCashFlows.slice(0, -1),
      sensLpLastValue - lpSaleShare + sensWaterfall.lpShare,
    ];
    const sensGpCashFlows = [
      ...gpCashFlows.slice(0, -1),
      sensGpLastValue - gpSaleShare + sensWaterfall.gpShare,
    ];

    sensitivityAnalysis.push({
      exitCapRate: capRate,
      exitValue: sensExitValue,
      lpIrr: calculateIRR(sensLpCashFlows),
      lpEquityMultiple: lpEquity > 0 ? sensLpTotal / lpEquity : 0,
      gpIrr: calculateIRR(sensGpCashFlows),
      gpEquityMultiple: gpEquity > 0 ? sensGpTotal / gpEquity : 0,
    });
  }

  return {
    // Capitalization Summary
    totalEquity,
    lpEquity,
    gpEquity,
    loanAmount,
    totalCapitalization,

    // Fee Summary
    acquisitionFee,
    totalAssetManagementFees,

    // Operating Projections
    yearlyProjections,
    totalNoiOverHold,

    // Exit Analysis
    exitNoi: exitNoiForValuation,
    exitValue,
    dispositionCosts,
    netSaleProceeds,
    loanPayoff,
    equityAtSale,

    // LP Returns
    lpTotalDistributions,
    lpEquityMultiple,
    lpIrr,
    lpPreferredReturnTotal,
    lpCashFlowDistributions: cumulativeLpDistributions,
    lpSaleProceedsDistribution: lpSaleShare,

    // GP Returns
    gpTotalDistributions,
    gpEquityMultiple,
    gpIrr,
    gpAcquisitionFee: acquisitionFee,
    gpAssetManagementFees: totalAssetManagementFees,
    gpPromote: promote,
    gpCashFlowDistributions: cumulativeGpDistributions - totalAssetManagementFees,
    gpSaleProceedsDistribution: gpSaleShare,

    // Deal Metrics
    goingInCapRate,
    averageCashOnCash,
    totalProfitOverHold,

    // Sensitivity Analysis
    sensitivityAnalysis,
  };
}
