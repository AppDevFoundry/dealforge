import { z } from 'zod';

/**
 * Zod validation schema for house hack calculator inputs
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
    .max(500000, 'Closing costs too high'),
  rehabCosts: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000000, 'Rehab costs too high'),

  // Financing
  financingType: z.enum(['fha', 'conventional', 'va', 'cash']),
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
  pmiRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(5, 'PMI rate too high'),

  // Property Structure
  numberOfUnits: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  ownerOccupiedUnit: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1')
    .max(4, 'Cannot exceed 4'),

  // Unit Rents
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

  // Owner's Housing Comparison
  equivalentRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Rent too high'),

  // Operating Expenses
  propertyTaxAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(500000, 'Property tax too high'),
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
    .max(50, 'Maintenance too high'),
  capexPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50, 'CapEx too high'),
  utilitiesMonthly: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10000, 'Utilities too high'),

  // Vacancy & Management
  vacancyRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50, 'Vacancy rate too high'),
  managementPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50, 'Management fee too high'),
});

export type HouseHackInputFormData = z.infer<typeof houseHackInputSchema>;
