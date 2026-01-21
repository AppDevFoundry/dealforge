import type { FlipInputs, FlipResults } from '@dealforge/types';

/**
 * Default values for the flip/rehab calculator
 */
export const FLIP_DEFAULTS: FlipInputs = {
  // Purchase
  purchasePrice: 150000,
  closingCostsBuyPercent: 2,
  rehabCosts: 40000,

  // ARV & Sale
  afterRepairValue: 250000,
  agentCommissionPercent: 6,
  closingCostsSellPercent: 2,

  // Holding Period
  holdingPeriodMonths: 4,
  holdingCostsMonthly: 1500,

  // Financing
  useLoan: true,
  loanToValuePercent: 80,
  loanInterestRate: 12,
  loanPointsPercent: 2,
  includeRehabInLoan: false,
};

/**
 * Explanations for flip-specific metrics (shown in Learn Mode)
 */
export const FLIP_METRIC_EXPLANATIONS: Record<keyof FlipResults, string> = {
  // Purchase Costs
  closingCostsBuy:
    'Costs to close on the purchase including title insurance, escrow fees, and lender fees. Formula: Purchase Price × Closing Cost %.',

  totalAcquisitionCost:
    'Total cost to acquire and rehab the property. Formula: Purchase Price + Closing Costs + Rehab Costs. This is the basis for your investment.',

  // Financing Details
  loanAmount:
    'Total amount borrowed for the flip. May include purchase loan only or purchase + rehab depending on your financing structure.',

  downPayment:
    'Cash needed at closing. Formula: Purchase Price - Loan Amount. If rehab is not financed, it is added to cash required.',

  loanPoints:
    'Origination fee paid to the lender upfront. Formula: Loan Amount × Points %. Typically 1-3 points for hard money loans.',

  monthlyLoanPayment:
    'Monthly interest payment on the loan. Hard money and flip loans are typically interest-only. Formula: Loan Amount × (Interest Rate / 12).',

  totalLoanInterest:
    'Total interest paid over the holding period. Formula: Monthly Payment × Holding Period Months. Keep holding period short to minimize this cost.',

  // Holding Costs
  totalHoldingCosts:
    'All costs during the flip including utilities, insurance, taxes, and loan interest. Formula: (Monthly Holding Costs × Months) + Total Loan Interest.',

  // Selling Costs
  agentCommission:
    'Real estate agent commission at sale. Formula: ARV × Commission %. Typically 5-6% split between buyer and seller agents.',

  closingCostsSell:
    'Seller closing costs including title, escrow, and transfer taxes. Formula: ARV × Closing Cost %. Typically 1-3%.',

  totalSellingCosts:
    'All costs to sell the property. Formula: Agent Commission + Closing Costs. These reduce your net proceeds.',

  // Total Costs
  totalProjectCost:
    'All costs from purchase to sale. Formula: Purchase + Buy Closing + Rehab + Points + Holding + Selling Costs. This determines your profit.',

  totalCashRequired:
    'Actual cash you need to complete the flip. Includes down payment, closing costs, points, and holding costs (but not amounts financed).',

  // Profit Metrics
  grossProfit:
    'Profit before accounting for all costs. Formula: ARV - Purchase Price - Rehab. A quick gauge of deal potential.',

  netProfit:
    'Actual profit after all costs. Formula: ARV - Total Project Cost. This is the money in your pocket.',

  profitMargin:
    'Net profit as percentage of sale price. Formula: Net Profit / ARV × 100. Target 10-15% minimum for a healthy flip.',

  roi: 'Return on your cash investment. Formula: Net Profit / Cash Required × 100. Higher leverage increases ROI but also risk.',

  annualizedRoi:
    'ROI scaled to annual rate. Formula: ROI × (12 / Holding Months). Useful for comparing to other investments.',

  // Analysis
  breakEvenPrice:
    'Minimum sale price to avoid a loss. Accounts for all costs including selling costs that scale with price.',

  maxAllowableOffer:
    'Maximum purchase price using the 70% Rule. Formula: ARV × 0.70 - Rehab Costs. A conservative guideline for flip offers.',

  dealMeetsSeventyPercentRule:
    'Whether your purchase price is at or below the 70% Rule MAO. This rule builds in profit margin and cushion for unexpected costs.',
};

/**
 * Input field labels for flip calculator
 */
export const FLIP_INPUT_LABELS = {
  // Purchase
  purchasePrice: { label: 'Purchase Price', prefix: '$' },
  closingCostsBuyPercent: { label: 'Closing Costs (Buy)', suffix: '%' },
  rehabCosts: { label: 'Rehab Budget', prefix: '$' },

  // ARV & Sale
  afterRepairValue: { label: 'After Repair Value (ARV)', prefix: '$' },
  agentCommissionPercent: { label: 'Agent Commission', suffix: '%' },
  closingCostsSellPercent: { label: 'Closing Costs (Sell)', suffix: '%' },

  // Holding Period
  holdingPeriodMonths: { label: 'Holding Period', suffix: 'months' },
  holdingCostsMonthly: { label: 'Monthly Holding Costs', prefix: '$' },

  // Financing
  useLoan: { label: 'Use Financing' },
  loanToValuePercent: { label: 'Loan to Value (LTV)', suffix: '%' },
  loanInterestRate: { label: 'Interest Rate', suffix: '%' },
  loanPointsPercent: { label: 'Origination Points', suffix: '%' },
  includeRehabInLoan: { label: 'Finance Rehab Costs' },
} as const;
