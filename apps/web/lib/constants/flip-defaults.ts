import type { FlipInputs, FlipResults } from '@dealforge/types';

/**
 * Default values for the Flip/Rehab calculator
 */
export const FLIP_DEFAULTS: FlipInputs = {
  purchasePrice: 150000,
  closingCostsBuy: 3000,
  rehabCosts: 40000,
  afterRepairValue: 250000,
  holdingPeriodMonths: 6,
  holdingCostsMonthly: 1500,
  useLoan: false,
  loanAmount: 120000,
  interestRate: 12,
  pointsPercent: 2,
  agentCommissionPercent: 6,
  closingCostsSell: 3000,
};

/**
 * Explanations for each result metric (shown in Learn Mode)
 */
export const FLIP_METRIC_EXPLANATIONS: Record<keyof FlipResults, string> = {
  netProfit:
    'Total profit after all costs. Formula: ARV - Purchase Price - Total Costs. This is your take-home from the flip.',

  grossProfit:
    'Profit before selling and financing costs. Formula: ARV - Purchase Price - Rehab Costs. Shows the raw margin from the value-add.',

  roi: 'Return on your cash invested. Formula: Net Profit / Total Cash Invested × 100. Higher is better — aim for 20%+ on flips.',

  annualizedRoi:
    'ROI scaled to a 12-month period. Formula: ROI / Holding Months × 12. Useful for comparing deals with different timelines.',

  profitMargin:
    'Net profit as a percentage of ARV. Formula: Net Profit / ARV × 100. A healthy flip targets 10-15% profit margin.',

  maxAllowableOffer:
    'Maximum purchase price to achieve a healthy profit using the 70% Rule. Formula: ARV × 70% - Rehab Costs. A widely-used quick analysis tool.',

  totalCosts:
    'All project costs excluding purchase price. Includes closing costs, rehab, holding, financing, and selling costs.',

  totalInvestment:
    'Total cash you put into the deal. If financing, this excludes the loan amount since that is borrowed capital.',

  breakEvenPrice:
    'Minimum sale price to avoid a loss. Formula: Purchase Price + Total Costs. Selling below this means losing money.',
};
