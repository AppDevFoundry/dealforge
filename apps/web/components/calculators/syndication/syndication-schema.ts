import { z } from 'zod';

/**
 * Zod validation schema for syndication calculator inputs
 */
export const syndicationInputSchema = z.object({
  // Project Capitalization
  purchasePrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(100000, 'Purchase price must be at least $100,000')
    .max(500000000, 'Purchase price too high'),
  closingCosts: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000000, 'Closing costs too high'),
  capexReserves: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000000, 'Reserves too high'),
  totalCapitalization: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative'),

  // Equity Structure
  lpEquityPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  gpEquityPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),

  // Debt
  loanToValue: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(90, 'LTV too high'),
  interestRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(25, 'Interest rate too high'),
  loanTermYears: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1 year')
    .max(40, 'Loan term too long'),
  amortizationYears: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1 year')
    .max(40, 'Amortization too long'),
  interestOnly: z.boolean(),
  interestOnlyYears: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10, 'Interest-only period too long'),

  // Fees
  acquisitionFeePercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(5, 'Acquisition fee too high'),
  assetManagementFeePercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(5, 'Asset management fee too high'),

  // Preferred Return
  preferredReturn: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(20, 'Preferred return too high'),

  // Waterfall Tiers
  tier1LpSplit: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  tier1GpSplit: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  tier2IrrHurdle: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50, 'Hurdle too high'),
  tier2LpSplit: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  tier2GpSplit: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  tier3IrrHurdle: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50, 'Hurdle too high'),
  tier3LpSplit: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  tier3GpSplit: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),

  // Property Operations
  grossPotentialRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000000, 'Rent too high'),
  vacancyRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50, 'Vacancy too high'),
  otherIncome: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000000, 'Other income too high'),
  operatingExpenseRatio: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(90, 'Expense ratio too high'),

  // Growth Assumptions
  rentGrowthRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(-10, 'Growth rate too low')
    .max(20, 'Growth rate too high'),
  expenseGrowthRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(20, 'Expense growth too high'),
  holdPeriodYears: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must hold at least 1 year')
    .max(15, 'Hold period too long'),

  // Exit Assumptions
  exitCapRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Cap rate must be at least 1%')
    .max(15, 'Cap rate too high'),
  dispositionFeePercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10, 'Disposition fee too high'),
});

export type SyndicationInputFormData = z.infer<typeof syndicationInputSchema>;
