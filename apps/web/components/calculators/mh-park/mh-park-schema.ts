import { z } from 'zod';

export const mhParkInputSchema = z.object({
  lotCount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must have at least 1 lot')
    .max(2000, 'Lot count too high'),
  averageLotRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Rent must be greater than 0')
    .max(5000, 'Rent too high'),
  occupancyRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  expenseRatio: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  purchasePrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Purchase price must be greater than 0')
    .max(500000000, 'Purchase price too high'),
  downPaymentPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  interestRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(30, 'Rate too high'),
  loanTermYears: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1 year')
    .max(40, 'Term too long'),
  amortizationYears: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1 year')
    .max(40, 'Term too long'),
});

export type MhParkInputFormData = z.infer<typeof mhParkInputSchema>;
