import { z } from 'zod';

export const syndicationInputSchema = z.object({
  // Capital Structure
  totalCapitalization: z.number().min(100000).max(1000000000),
  lpEquityPercent: z.number().min(1).max(99),
  gpEquityPercent: z.number().min(1).max(99),

  // Fees
  acquisitionFeePercent: z.number().min(0).max(10),
  assetManagementFeePercent: z.number().min(0).max(10),

  // Preferred Return
  preferredReturnPercent: z.number().min(0).max(20),

  // Waterfall Tiers
  tier2LpPercent: z.number().min(0).max(100),
  tier2GpPercent: z.number().min(0).max(100),
  tier2IrrHurdle: z.number().min(0).max(50),
  tier3LpPercent: z.number().min(0).max(100),
  tier3GpPercent: z.number().min(0).max(100),
  tier3IrrHurdle: z.number().min(0).max(50),
  tier4LpPercent: z.number().min(0).max(100),
  tier4GpPercent: z.number().min(0).max(100),

  // Operations
  holdPeriodYears: z.number().min(1).max(15),
  year1NOI: z.number().min(0).max(100000000),
  noiGrowthPercent: z.number().min(-10).max(20),

  // Exit
  exitCapRate: z.number().min(1).max(20),
  exitCostPercent: z.number().min(0).max(15),
});

export type SyndicationFormValues = z.infer<typeof syndicationInputSchema>;
