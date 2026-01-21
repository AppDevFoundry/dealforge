import { z } from 'zod';

/**
 * Zod validation schema for multi-family calculator inputs
 */
export const multifamilyInputSchema = z.object({
  // Property Info
  purchasePrice: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Purchase price must be greater than 0')
    .max(500000000, 'Purchase price too high'),
  closingCostsPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10, 'Closing costs too high'),
  totalUnits: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(5, 'Must have at least 5 units')
    .max(500, 'Too many units for this calculator'),
  squareFootage: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000000, 'Square footage too high'),

  // Unit Mix
  studioCount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(500, 'Count too high'),
  studioRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50000, 'Rent too high'),
  oneBedCount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(500, 'Count too high'),
  oneBedRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50000, 'Rent too high'),
  twoBedCount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(500, 'Count too high'),
  twoBedRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50000, 'Rent too high'),
  threeBedCount: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(500, 'Count too high'),
  threeBedRent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50000, 'Rent too high'),

  // Other Income
  laundryIncome: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Income too high'),
  parkingIncome: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Income too high'),
  storageIncome: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Income too high'),
  petFees: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50000, 'Fees too high'),
  otherIncome: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Income too high'),

  // Vacancy & Credit Loss
  vacancyRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(50, 'Vacancy rate too high'),
  creditLossRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(20, 'Credit loss too high'),

  // Operating Expenses
  useExpenseRatio: z.boolean(),
  expenseRatio: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100, 'Expense ratio too high'),

  // Itemized Expenses
  propertyTaxAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(5000000, 'Property tax too high'),
  insuranceAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(1000000, 'Insurance too high'),
  utilitiesAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(500000, 'Utilities too high'),
  repairsMaintenanceAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(500000, 'Repairs too high'),
  managementPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(20, 'Management fee too high'),
  payrollAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(500000, 'Payroll too high'),
  advertisingAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Advertising too high'),
  legalAccountingAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Legal/accounting too high'),
  landscapingAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(100000, 'Landscaping too high'),
  contractServicesAnnual: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(200000, 'Contract services too high'),
  reservesPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(20, 'Reserves too high'),

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
  amortizationYears: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(1, 'Must be at least 1 year')
    .max(40, 'Amortization too long'),
  loanPointsPercent: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0, 'Cannot be negative')
    .max(10, 'Points too high'),

  // Valuation
  marketCapRate: z
    .number({ invalid_type_error: 'Must be a number' })
    .min(0.1, 'Cap rate must be greater than 0')
    .max(20, 'Cap rate too high'),
});

export type MultifamilyInputFormData = z.infer<typeof multifamilyInputSchema>;
