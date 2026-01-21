import { z } from 'zod';

/**
 * Zod validation schema for flip/rehab calculator inputs
 */
export const flipInputSchema = z.object({
  // Purchase
  purchasePrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Purchase price must be greater than 0')
    .max(100000000, 'Purchase price too high'),
  closingCostsBuyPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(20, 'Closing costs too high'),
  rehabCosts: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000000, 'Rehab costs too high'),

  // ARV & Sale
  afterRepairValue: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'ARV must be greater than 0')
    .max(100000000, 'ARV too high'),
  agentCommissionPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(15, 'Commission too high'),
  closingCostsSellPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(20, 'Closing costs too high'),

  // Holding Period
  holdingPeriodMonths: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1 month')
    .max(36, 'Holding period too long'),
  holdingCostsMonthly: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50000, 'Holding costs too high'),

  // Financing
  useLoan: z.boolean(),
  loanToValuePercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  loanInterestRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50, 'Interest rate too high'),
  loanPointsPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(20, 'Points too high'),
  includeRehabInLoan: z.boolean(),
});

export type FlipInputFormData = z.infer<typeof flipInputSchema>;
