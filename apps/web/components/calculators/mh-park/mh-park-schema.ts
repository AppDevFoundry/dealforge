import { z } from 'zod';

/**
 * Zod validation schema for MH Park calculator inputs
 */
export const mhParkInputSchema = z.object({
  // Property Info
  lotCount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must have at least 1 lot')
    .max(1000, 'Lot count too high'),
  occupiedLots: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000, 'Occupied lots too high'),
  avgLotRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(5000, 'Lot rent too high'),
  purchasePrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Purchase price must be greater than 0')
    .max(100000000, 'Purchase price too high'),

  // Financing
  downPaymentPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  interestRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(30, 'Interest rate too high'),
  loanTermYears: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1 year')
    .max(40, 'Loan term too long'),
  closingCostsPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10, 'Closing costs too high'),

  // Income & Expenses
  expenseRatioPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Expense ratio too high'),
  otherIncomeMonthly: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Other income too high'),

  // Valuation
  marketCapRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0.1, 'Cap rate must be greater than 0')
    .max(25, 'Cap rate too high'),
});

export type MhParkInputFormData = z.infer<typeof mhParkInputSchema>;
