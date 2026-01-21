import { z } from 'zod';

/**
 * Zod validation schema for Flip/Rehab calculator inputs
 */
export const flipInputSchema = z.object({
  // Purchase & ARV
  purchasePrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Purchase price must be greater than 0')
    .max(100000000, 'Purchase price too high'),
  closingCostsBuy: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000000, 'Closing costs too high'),
  afterRepairValue: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'ARV must be greater than 0')
    .max(100000000, 'ARV too high'),

  // Rehab & Holding
  rehabCosts: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000000, 'Rehab costs too high'),
  holdingPeriodMonths: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1 month')
    .max(60, 'Holding period too long'),
  holdingCostsMonthly: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Holding costs too high'),

  // Financing (conditionally validated)
  useLoan: z.boolean(),
  loanAmount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000000, 'Loan amount too high'),
  interestRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(30, 'Interest rate too high'),
  pointsPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10, 'Points too high'),

  // Selling Costs
  agentCommissionPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10, 'Commission too high'),
  closingCostsSell: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000000, 'Closing costs too high'),
});

export type FlipInputFormData = z.infer<typeof flipInputSchema>;
