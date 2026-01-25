/**
 * UI Catalog Schemas
 *
 * Zod schemas for validating dynamic UI component data.
 * These can be used with AI SDK's streamObject for structured output.
 */

import { z } from 'zod';

/**
 * Stat component schema
 */
export const statSchema = z.object({
  type: z.literal('stat'),
  label: z.string().describe('Label for the statistic'),
  value: z.union([z.string(), z.number()]).describe('The statistic value'),
  unit: z.string().optional().describe('Unit of measurement (e.g., "$", "%", "lots")'),
  change: z
    .object({
      value: z.number().describe('Change amount'),
      direction: z.enum(['up', 'down', 'neutral']).describe('Direction of change'),
      period: z.string().optional().describe('Time period (e.g., "YoY", "MoM")'),
    })
    .optional()
    .describe('Change indicator'),
  icon: z
    .enum(['dollar', 'percent', 'home', 'users', 'chart', 'alert'])
    .optional()
    .describe('Icon to display'),
});

/**
 * Stats group schema
 */
export const statsGroupSchema = z.object({
  type: z.literal('stats-group'),
  stats: z.array(statSchema.omit({ type: true })).describe('Array of statistics to display'),
});

/**
 * Table schema
 */
export const tableSchema = z.object({
  type: z.literal('table'),
  title: z.string().optional().describe('Table title'),
  columns: z
    .array(
      z.object({
        key: z.string().describe('Data key'),
        header: z.string().describe('Column header text'),
        align: z.enum(['left', 'center', 'right']).optional().describe('Text alignment'),
      })
    )
    .describe('Column definitions'),
  data: z
    .array(z.record(z.union([z.string(), z.number(), z.null()])))
    .describe('Row data'),
  striped: z.boolean().optional().describe('Alternate row colors'),
});

/**
 * Bar chart schema
 */
export const barChartSchema = z.object({
  type: z.literal('bar-chart'),
  title: z.string().optional().describe('Chart title'),
  data: z
    .array(
      z.object({
        name: z.string().describe('Category name'),
        value: z.number().describe('Value'),
        fill: z.string().optional().describe('Bar color'),
      })
    )
    .describe('Chart data'),
  xAxisLabel: z.string().optional().describe('X-axis label'),
  yAxisLabel: z.string().optional().describe('Y-axis label'),
  height: z.number().optional().describe('Chart height in pixels'),
});

/**
 * Line chart schema
 */
export const lineChartSchema = z.object({
  type: z.literal('line-chart'),
  title: z.string().optional().describe('Chart title'),
  data: z
    .array(z.record(z.union([z.string(), z.number()])))
    .describe('Chart data points'),
  lines: z
    .array(
      z.object({
        dataKey: z.string().describe('Data key for this line'),
        color: z.string().optional().describe('Line color'),
        name: z.string().optional().describe('Legend name'),
      })
    )
    .describe('Line configurations'),
  xAxisLabel: z.string().optional().describe('X-axis label'),
  yAxisLabel: z.string().optional().describe('Y-axis label'),
  height: z.number().optional().describe('Chart height in pixels'),
});

/**
 * Park card schema
 */
export const parkCardSchema = z.object({
  type: z.literal('park-card'),
  parkId: z.string().describe('Park ID for navigation'),
  name: z.string().describe('Park name'),
  address: z.string().describe('Street address'),
  city: z.string().describe('City'),
  county: z.string().describe('County'),
  lotCount: z.number().nullable().describe('Number of lots'),
  distressScore: z.number().nullable().describe('Distress score 0-100'),
  totalTaxOwed: z.number().optional().describe('Total tax owed'),
  clickable: z.boolean().optional().describe('Make card clickable'),
});

/**
 * Deal summary schema
 */
export const dealSummarySchema = z.object({
  type: z.literal('deal-summary'),
  parkName: z.string().describe('Park name'),
  metrics: z
    .object({
      capRate: z.number().optional().describe('Cap rate percentage'),
      cashOnCash: z.number().optional().describe('Cash-on-cash return percentage'),
      dscr: z.number().optional().describe('Debt service coverage ratio'),
      noi: z.number().optional().describe('Net operating income'),
      pricePerLot: z.number().optional().describe('Price per lot'),
    })
    .describe('Financial metrics'),
  recommendation: z
    .enum(['strong-buy', 'buy', 'hold', 'avoid'])
    .describe('Investment recommendation'),
  highlights: z.array(z.string()).describe('Positive aspects'),
  concerns: z.array(z.string()).describe('Risk factors'),
});

/**
 * Market snapshot schema
 */
export const marketSnapshotSchema = z.object({
  type: z.literal('market-snapshot'),
  county: z.string().describe('County name'),
  fmr: z
    .object({
      twoBedroom: z.number().describe('2BR Fair Market Rent'),
      suggestedLotRent: z
        .object({
          low: z.number(),
          high: z.number(),
        })
        .describe('Suggested lot rent range'),
    })
    .optional()
    .describe('Fair Market Rent data'),
  demographics: z
    .object({
      population: z.number().describe('Total population'),
      medianIncome: z.number().describe('Median household income'),
      mobileHomesPercent: z.number().optional().describe('% of housing that are mobile homes'),
    })
    .optional()
    .describe('Census demographics'),
  employment: z
    .object({
      unemploymentRate: z.number().describe('Unemployment rate'),
      trend: z.enum(['improving', 'stable', 'declining']).optional().describe('Employment trend'),
    })
    .optional()
    .describe('Employment data'),
  insights: z.array(z.string()).describe('Market insights'),
});

/**
 * Alert banner schema
 */
export const alertBannerSchema = z.object({
  type: z.literal('alert-banner'),
  variant: z.enum(['info', 'success', 'warning', 'error']).describe('Alert type'),
  title: z.string().optional().describe('Alert title'),
  message: z.string().describe('Alert message'),
  dismissible: z.boolean().optional().describe('Can be dismissed'),
});

/**
 * Comparison table schema
 */
export const comparisonTableSchema = z.object({
  type: z.literal('comparison-table'),
  title: z.string().optional().describe('Table title'),
  items: z
    .array(
      z.object({
        name: z.string().describe('Item name'),
        metrics: z.record(z.union([z.string(), z.number(), z.null()])).describe('Item metrics'),
      })
    )
    .describe('Items to compare'),
  metricLabels: z.record(z.string()).describe('Display labels for metric keys'),
  highlightBest: z.boolean().optional().describe('Highlight best values'),
});

/**
 * Union schema for all UI elements
 */
export const uiElementSchema = z.discriminatedUnion('type', [
  statSchema.extend({ id: z.string() }),
  statsGroupSchema.extend({ id: z.string() }),
  tableSchema.extend({ id: z.string() }),
  barChartSchema.extend({ id: z.string() }),
  lineChartSchema.extend({ id: z.string() }),
  parkCardSchema.extend({ id: z.string() }),
  dealSummarySchema.extend({ id: z.string() }),
  marketSnapshotSchema.extend({ id: z.string() }),
  alertBannerSchema.extend({ id: z.string() }),
  comparisonTableSchema.extend({ id: z.string() }),
]);

/**
 * Array of UI elements
 */
export const uiElementsSchema = z.array(uiElementSchema);

export type UIElementSchema = z.infer<typeof uiElementSchema>;
