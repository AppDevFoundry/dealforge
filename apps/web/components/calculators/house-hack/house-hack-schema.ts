import { z } from 'zod';

/**
 * Zod validation schema for House Hack calculator inputs
 */
export const houseHackInputSchema = z.object({
  // Purchase
  purchasePrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Purchase price must be greater than 0')
    .max(100000000, 'Purchase price too high'),
  closingCosts: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000000, 'Closing costs too high'),

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

  // Units
  numberOfUnits: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(2, 'Must have at least 2 units')
    .max(4, 'Maximum 4 units for house hack'),
  ownerUnit: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1')
    .max(4, 'Maximum 4 units'),
  unit1Rent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Rent too high'),
  unit2Rent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Rent too high'),
  unit3Rent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Rent too high'),
  unit4Rent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Rent too high'),
  ownerEquivalentRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Rent too high'),

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
  vacancyRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Cannot exceed 100%'),
});

export type HouseHackInputFormData = z.infer<typeof houseHackInputSchema>;
