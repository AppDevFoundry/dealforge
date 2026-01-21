import type {
  SyndicationInputs,
  SyndicationResults,
  SyndicationSensitivityRow,
  SyndicationYearlyData,
} from '@dealforge/types';

/**
 * Calculate IRR using Newton-Raphson method
 * Returns annual rate as a percentage (e.g., 12.5 for 12.5%)
 */
function calculateIRR(cashFlows: number[], maxIterations = 100, tolerance = 0.0001): number {
  if (cashFlows.length < 2) return 0;

  // Check if all cash flows are zero or same sign
  const hasNegative = cashFlows.some((cf) => cf < 0);
  const hasPositive = cashFlows.some((cf) => cf > 0);
  if (!hasNegative || !hasPositive) return 0;

  let rate = 0.1; // Initial guess: 10%

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let derivative = 0;

    for (let t = 0; t < cashFlows.length; t++) {
      const cf = cashFlows[t] as number;
      const discountFactor = (1 + rate) ** t;
      npv += cf / discountFactor;
      if (t > 0) {
        derivative -= (t * cf) / (1 + rate) ** (t + 1);
      }
    }

    if (Math.abs(npv) < tolerance) {
      return rate * 100;
    }

    if (Math.abs(derivative) < 1e-10) {
      // Derivative too small, try a different starting point
      rate = rate + 0.05;
      continue;
    }

    const newRate = rate - npv / derivative;

    // Guard against divergence
    if (newRate < -0.99) {
      rate = -0.5;
      continue;
    }
    if (newRate > 10) {
      rate = 5;
      continue;
    }

    rate = newRate;
  }

  return rate * 100;
}

/**
 * Run the syndication waterfall for a given set of inputs and exit cap rate
 * Returns LP/GP cash flow arrays and computed metrics
 */
function runWaterfall(
  inputs: SyndicationInputs,
  exitCapRate: number
): {
  lpCashFlows: number[];
  gpCashFlows: number[];
  yearlyData: SyndicationYearlyData[];
  exitPrice: number;
  totalAssetManagementFees: number;
  gpPromote: number;
} {
  const totalEquity = inputs.totalCapitalization;
  const lpEquity = totalEquity * (inputs.lpEquityPercent / 100);
  const gpEquity = totalEquity * (inputs.gpEquityPercent / 100);
  const acquisitionFee = totalEquity * (inputs.acquisitionFeePercent / 100);

  // Year 0: Investment
  // LP invests their equity
  // GP invests their equity but receives acquisition fee
  const lpCashFlows: number[] = [-lpEquity];
  const gpCashFlows: number[] = [-gpEquity + acquisitionFee];

  const yearlyData: SyndicationYearlyData[] = [];
  let cumulativeLpDist = 0;
  let cumulativeGpDist = 0;
  let totalAssetManagementFees = 0;
  let accruedPreferredReturn = 0;

  // Annual preferred return owed to LP
  const annualPreferredReturn = lpEquity * (inputs.preferredReturnPercent / 100);

  // Years 1 through holdPeriod: Operating distributions
  for (let year = 1; year <= inputs.holdPeriodYears; year++) {
    const noi = inputs.year1NOI * (1 + inputs.noiGrowthPercent / 100) ** (year - 1);
    const assetMgmtFee = totalEquity * (inputs.assetManagementFeePercent / 100);
    totalAssetManagementFees += assetMgmtFee;

    const distributableCash = noi - assetMgmtFee;

    let lpDist = 0;
    let gpDist = assetMgmtFee; // GP always gets mgmt fee

    if (distributableCash > 0) {
      // First: LP preferred return (including any accrued from prior years)
      const prefOwed = annualPreferredReturn + accruedPreferredReturn;
      if (distributableCash >= prefOwed) {
        lpDist += prefOwed;
        accruedPreferredReturn = 0;

        // Surplus after pref: split at tier2 rates
        const surplus = distributableCash - prefOwed;
        lpDist += surplus * (inputs.tier2LpPercent / 100);
        gpDist += surplus * (inputs.tier2GpPercent / 100);
      } else {
        // Not enough to cover pref — all goes to LP, track accrual
        lpDist += distributableCash;
        accruedPreferredReturn += annualPreferredReturn - distributableCash;
      }
    } else {
      // Negative distributable: accrue the full pref
      accruedPreferredReturn += annualPreferredReturn;
    }

    cumulativeLpDist += lpDist;
    cumulativeGpDist += gpDist;

    lpCashFlows.push(lpDist);
    gpCashFlows.push(gpDist);

    yearlyData.push({
      year,
      noi,
      assetManagementFee: assetMgmtFee,
      distributableCash: Math.max(0, distributableCash),
      lpDistribution: lpDist,
      gpDistribution: gpDist,
      cumulativeLpDistributions: cumulativeLpDist,
      cumulativeGpDistributions: cumulativeGpDist,
    });
  }

  // Exit: Sale in final year
  const terminalNOI =
    inputs.year1NOI * (1 + inputs.noiGrowthPercent / 100) ** inputs.holdPeriodYears;
  const grossExitPrice = exitCapRate > 0 ? terminalNOI / (exitCapRate / 100) : 0;
  const exitCosts = grossExitPrice * (inputs.exitCostPercent / 100);
  const netSaleProceeds = grossExitPrice - exitCosts;

  // Apply waterfall to exit proceeds
  let remainingProceeds = netSaleProceeds;
  let lpExitDist = 0;
  let gpExitDist = 0;

  // Step 1: Return LP capital
  const lpCapitalReturn = Math.min(remainingProceeds, lpEquity);
  lpExitDist += lpCapitalReturn;
  remainingProceeds -= lpCapitalReturn;

  // Step 2: Pay any accrued preferred return
  if (remainingProceeds > 0 && accruedPreferredReturn > 0) {
    const prefPayment = Math.min(remainingProceeds, accruedPreferredReturn);
    lpExitDist += prefPayment;
    remainingProceeds -= prefPayment;
  }

  // Step 3: Return GP capital
  if (remainingProceeds > 0) {
    const gpCapitalReturn = Math.min(remainingProceeds, gpEquity);
    gpExitDist += gpCapitalReturn;
    remainingProceeds -= gpCapitalReturn;
  }

  // Step 4: Distribute remaining profit through waterfall tiers
  // Determine which tier applies based on LP IRR achieved so far
  let gpPromote = 0;
  if (remainingProceeds > 0) {
    // Calculate LP IRR with just capital return + pref (before profit split)
    const testLpFlows = [...lpCashFlows];
    testLpFlows[testLpFlows.length - 1] =
      (testLpFlows[testLpFlows.length - 1] as number) + lpExitDist;

    // Try allocating profit at tier2 split and check IRR
    const tier2LpShare = remainingProceeds * (inputs.tier2LpPercent / 100);
    const testFlowsTier2 = [...testLpFlows];
    testFlowsTier2[testFlowsTier2.length - 1] =
      (testFlowsTier2[testFlowsTier2.length - 1] as number) + tier2LpShare;
    const irrAtTier2 = calculateIRR(testFlowsTier2);

    if (irrAtTier2 <= inputs.tier2IrrHurdle) {
      // All profit at tier2 split
      lpExitDist += remainingProceeds * (inputs.tier2LpPercent / 100);
      gpExitDist += remainingProceeds * (inputs.tier2GpPercent / 100);
      gpPromote += remainingProceeds * (inputs.tier2GpPercent / 100);
    } else {
      // Need to split between tiers
      // Allocate tier2 portion: find how much gives LP the tier2 hurdle IRR
      // For simplicity, use the ratio approach
      const tier3LpShare = remainingProceeds * (inputs.tier3LpPercent / 100);
      const testFlowsTier3 = [...testLpFlows];
      testFlowsTier3[testFlowsTier3.length - 1] =
        (testFlowsTier3[testFlowsTier3.length - 1] as number) + tier3LpShare;
      const irrAtTier3 = calculateIRR(testFlowsTier3);

      if (irrAtTier3 <= inputs.tier3IrrHurdle) {
        // All at tier3 split
        lpExitDist += remainingProceeds * (inputs.tier3LpPercent / 100);
        gpExitDist += remainingProceeds * (inputs.tier3GpPercent / 100);
        gpPromote += remainingProceeds * (inputs.tier3GpPercent / 100);
      } else {
        // At tier4 split
        lpExitDist += remainingProceeds * (inputs.tier4LpPercent / 100);
        gpExitDist += remainingProceeds * (inputs.tier4GpPercent / 100);
        gpPromote += remainingProceeds * (inputs.tier4GpPercent / 100);
      }
    }
  }

  // Add exit distributions to final year cash flows
  lpCashFlows[lpCashFlows.length - 1] =
    (lpCashFlows[lpCashFlows.length - 1] as number) + lpExitDist;
  gpCashFlows[gpCashFlows.length - 1] =
    (gpCashFlows[gpCashFlows.length - 1] as number) + gpExitDist;

  return {
    lpCashFlows,
    gpCashFlows,
    yearlyData,
    exitPrice: grossExitPrice,
    totalAssetManagementFees,
    gpPromote,
  };
}

/**
 * Main calculation function for Syndication analysis
 * Models LP/GP waterfall distributions with preferred returns, IRR hurdles, and promote
 * This is a pure function designed for easy porting to Rust/WASM
 */
export function calculateSyndicationMetrics(inputs: SyndicationInputs): SyndicationResults {
  const totalEquity = inputs.totalCapitalization;
  const lpEquity = totalEquity * (inputs.lpEquityPercent / 100);
  const gpEquity = totalEquity * (inputs.gpEquityPercent / 100);
  const acquisitionFee = totalEquity * (inputs.acquisitionFeePercent / 100);

  // Run main waterfall
  const { lpCashFlows, gpCashFlows, yearlyData, exitPrice, totalAssetManagementFees, gpPromote } =
    runWaterfall(inputs, inputs.exitCapRate);

  // Calculate metrics
  const lpIrr = calculateIRR(lpCashFlows);
  const gpIrr = calculateIRR(gpCashFlows);

  // Total distributions (sum of all positive cash flows)
  const lpTotalDistributions = lpCashFlows.filter((cf) => cf > 0).reduce((sum, cf) => sum + cf, 0);
  const gpTotalDistributions = gpCashFlows.filter((cf) => cf > 0).reduce((sum, cf) => sum + cf, 0);

  const lpEquityMultiple = lpEquity > 0 ? lpTotalDistributions / lpEquity : 0;
  const gpEquityMultiple = gpEquity > 0 ? (gpTotalDistributions + acquisitionFee) / gpEquity : 0;

  const totalProjectProfit = lpTotalDistributions + gpTotalDistributions - lpEquity - gpEquity;

  // Sensitivity analysis: vary exit cap rate from -2% to +2% in 0.5% steps
  const sensitivityData: SyndicationSensitivityRow[] = [];
  const baseRate = inputs.exitCapRate;
  for (let delta = -2; delta <= 2; delta += 0.5) {
    const testRate = baseRate + delta;
    if (testRate <= 0) continue;

    const {
      lpCashFlows: testLp,
      gpCashFlows: testGp,
      exitPrice: testExit,
    } = runWaterfall(inputs, testRate);

    const testLpIrr = calculateIRR(testLp);
    const testGpIrr = calculateIRR(testGp);
    const testLpDist = testLp.filter((cf) => cf > 0).reduce((sum, cf) => sum + cf, 0);
    const testGpDist = testGp.filter((cf) => cf > 0).reduce((sum, cf) => sum + cf, 0);

    sensitivityData.push({
      exitCapRate: testRate,
      exitPrice: testExit,
      lpIrr: testLpIrr,
      gpIrr: testGpIrr,
      lpEquityMultiple: lpEquity > 0 ? testLpDist / lpEquity : 0,
      gpEquityMultiple: gpEquity > 0 ? (testGpDist + acquisitionFee) / gpEquity : 0,
    });
  }

  return {
    lpTotalDistributions,
    lpIrr,
    lpEquityMultiple,
    lpEquityContribution: lpEquity,
    gpTotalDistributions,
    gpIrr,
    gpEquityMultiple,
    gpEquityContribution: gpEquity,
    gpPromote,
    totalAcquisitionFees: acquisitionFee,
    totalAssetManagementFees,
    totalProjectProfit,
    exitPrice,
    totalEquity,
    yearlyData,
    sensitivityData,
  };
}
