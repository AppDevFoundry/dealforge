import { z } from 'zod';

/**
 * Zod validation schema for rental property calculator inputs
 */
export const rentalInputSchema = z.object({
  // Purchase
  purchasePrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Purchase price must be greater than 0')
    .max(100000000, 'Purchase price too high'),
  closingCosts: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000000, 'Closing costs too high'),
  rehabCosts: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000000, 'Rehab costs too high'),

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
    .max(50, 'Loan term too long'),

  // Income
  monthlyRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000000, 'Monthly rent too high'),
  otherIncome: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Other income too high'),
  vacancyRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),

  // Expenses
  propertyTaxAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000000, 'Property tax too high'),
  insuranceAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Insurance too high'),
  hoaMonthly: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000, 'HOA too high'),
  maintenancePercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  capexPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
  managementPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
});

export type RentalInputFormData = z.infer<typeof rentalInputSchema>;
