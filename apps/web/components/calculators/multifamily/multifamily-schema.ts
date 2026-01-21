import { z } from 'zod';

export const multifamilyInputSchema = z.object({
  // Purchase
  purchasePrice: z.number().min(1).max(500000000),
  closingCosts: z.number().min(0).max(10000000),

  // Units
  numberOfUnits: z.number().min(5).max(50),
  units1BR: z.number().min(0).max(50),
  rent1BR: z.number().min(0).max(50000),
  units2BR: z.number().min(0).max(50),
  rent2BR: z.number().min(0).max(50000),
  units3BR: z.number().min(0).max(50),
  rent3BR: z.number().min(0).max(50000),

  // Other Income
  laundryMonthly: z.number().min(0).max(100000),
  parkingMonthly: z.number().min(0).max(100000),
  petFeesMonthly: z.number().min(0).max(100000),
  storageMonthly: z.number().min(0).max(100000),

  // Vacancy
  vacancyRate: z.number().min(0).max(100),

  // Expenses
  useExpenseRatio: z.boolean(),
  expenseRatio: z.number().min(0).max(100),
  propertyTaxAnnual: z.number().min(0).max(10000000),
  insuranceAnnual: z.number().min(0).max(10000000),
  utilitiesMonthly: z.number().min(0).max(100000),
  maintenanceMonthly: z.number().min(0).max(100000),
  managementPercent: z.number().min(0).max(30),
  payrollMonthly: z.number().min(0).max(500000),
  adminMonthly: z.number().min(0).max(100000),
  contractServicesMonthly: z.number().min(0).max(100000),
  replacementReservesMonthly: z.number().min(0).max(100000),

  // Financing
  downPaymentPercent: z.number().min(0).max(100),
  interestRate: z.number().min(0).max(30),
  loanTermYears: z.number().min(1).max(40),

  // Valuation
  marketCapRate: z.number().min(0.1).max(30),
});

export type MultifamilyFormValues = z.infer<typeof multifamilyInputSchema>;
