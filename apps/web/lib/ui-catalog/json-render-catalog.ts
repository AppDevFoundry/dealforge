/**
 * JSON-Render Catalog Definition
 *
 * Defines the component catalog and actions for AI-generated UI with streaming support.
 * This integrates with json-render for progressive rendering and safe action handling.
 */

import { createCatalog } from '@json-render/core';
import { z } from 'zod';

/**
 * Component catalog for AI-generated UI
 *
 * Each component defines:
 * - props: Zod schema for component props
 * - description: Used by AI to understand when to use this component
 */
export const uiCatalog = createCatalog({
  components: {
    // Single metric display
    Stat: {
      props: z.object({
        label: z.string().describe('Label for the metric'),
        value: z.union([z.string(), z.number()]).describe('The metric value'),
        unit: z.string().optional().describe('Unit of measurement (e.g., "$", "%", "lots")'),
        icon: z
          .enum(['dollar', 'percent', 'home', 'users', 'chart', 'alert'])
          .optional()
          .describe('Icon to display'),
        change: z
          .object({
            value: z.number().describe('Change amount'),
            direction: z.enum(['up', 'down', 'neutral']).describe('Direction of change'),
            period: z.string().optional().describe('Time period (e.g., "vs last month")'),
          })
          .optional()
          .describe('Change indicator'),
      }),
      description: 'Display a single metric/KPI with optional change indicator',
    },

    // Group of stats in a row
    StatsGroup: {
      props: z.object({
        stats: z.array(
          z.object({
            label: z.string(),
            value: z.union([z.string(), z.number()]),
            unit: z.string().optional(),
            icon: z.enum(['dollar', 'percent', 'home', 'users', 'chart', 'alert']).optional(),
            change: z
              .object({
                value: z.number(),
                direction: z.enum(['up', 'down', 'neutral']),
                period: z.string().optional(),
              })
              .optional(),
          })
        ),
      }),
      description: 'Display multiple metrics in a horizontal row',
    },

    // Data table
    Table: {
      props: z.object({
        title: z.string().optional().describe('Table title'),
        columns: z.array(
          z.object({
            key: z.string().describe('Data key'),
            header: z.string().describe('Column header text'),
            align: z.enum(['left', 'center', 'right']).optional(),
          })
        ),
        data: z.array(z.record(z.union([z.string(), z.number(), z.null()]))),
        striped: z.boolean().optional().describe('Alternate row colors'),
      }),
      description: 'Display tabular data with columns and rows',
    },

    // Bar chart
    BarChart: {
      props: z.object({
        title: z.string().optional(),
        data: z.array(
          z.object({
            name: z.string().describe('Category/label'),
            value: z.number().describe('Numeric value'),
            fill: z.string().optional().describe('Bar color'),
          })
        ),
        xAxisLabel: z.string().optional(),
        yAxisLabel: z.string().optional(),
        height: z.number().optional().default(300),
      }),
      description: 'Display data as a bar chart',
    },

    // Line chart
    LineChart: {
      props: z.object({
        title: z.string().optional(),
        data: z.array(z.record(z.union([z.string(), z.number()]))),
        lines: z.array(
          z.object({
            dataKey: z.string().describe('Key in data for this line'),
            name: z.string().optional().describe('Legend name'),
            color: z.string().optional().describe('Line color'),
          })
        ),
        xAxisLabel: z.string().optional(),
        yAxisLabel: z.string().optional(),
        height: z.number().optional().default(300),
      }),
      description: 'Display trends over time as a line chart',
    },

    // MH Park card
    ParkCard: {
      props: z.object({
        parkId: z.string().describe('Park ID for navigation'),
        name: z.string().describe('Park name'),
        address: z.string(),
        city: z.string(),
        county: z.string(),
        lotCount: z.number().nullable(),
        distressScore: z.number().nullable().describe('0-100 distress score'),
        totalTaxOwed: z.number().optional(),
        clickable: z.boolean().optional().default(true),
      }),
      description: 'Display summary of a mobile home park with distress indicators',
    },

    // Deal analysis summary
    DealSummary: {
      props: z.object({
        parkName: z.string(),
        metrics: z.object({
          capRate: z.number().optional(),
          cashOnCash: z.number().optional(),
          dscr: z.number().optional(),
          noi: z.number().optional(),
          pricePerLot: z.number().optional(),
        }),
        recommendation: z.enum(['strong-buy', 'buy', 'hold', 'avoid']),
        highlights: z.array(z.string()).describe('Positive aspects'),
        concerns: z.array(z.string()).describe('Risk factors'),
      }),
      description: 'Display deal analysis with investment recommendation',
    },

    // Market snapshot
    MarketSnapshot: {
      props: z.object({
        county: z.string(),
        fmr: z
          .object({
            twoBedroom: z.number(),
            suggestedLotRent: z.object({ low: z.number(), high: z.number() }),
          })
          .optional(),
        demographics: z
          .object({
            population: z.number(),
            medianIncome: z.number(),
            mobileHomesPercent: z.number().optional(),
          })
          .optional(),
        employment: z
          .object({
            unemploymentRate: z.number(),
            trend: z.enum(['improving', 'stable', 'declining']).optional(),
          })
          .optional(),
        insights: z.array(z.string()),
      }),
      description: 'Display market intelligence for a county',
    },

    // Alert/notification banner
    AlertBanner: {
      props: z.object({
        variant: z.enum(['info', 'success', 'warning', 'error']),
        title: z.string().optional(),
        message: z.string(),
        dismissible: z.boolean().optional().default(false),
      }),
      description: 'Display an alert or notification message',
    },

    // Side-by-side comparison
    ComparisonTable: {
      props: z.object({
        title: z.string().optional(),
        items: z.array(
          z.object({
            name: z.string().describe('Item name (e.g., park name, county)'),
            metrics: z.record(z.union([z.string(), z.number(), z.null()])),
          })
        ),
        metricLabels: z.record(z.string()).describe('Map of metric keys to display labels'),
        highlightBest: z.boolean().optional().default(false),
      }),
      description: 'Compare multiple items side-by-side',
    },

    // Action button
    ActionButton: {
      props: z.object({
        label: z.string(),
        action: z.string().describe('Action name to trigger'),
        params: z.record(z.unknown()).optional().describe('Action parameters'),
        variant: z.enum(['default', 'secondary', 'outline', 'destructive']).optional(),
        confirmMessage: z.string().optional().describe('Confirmation prompt before action'),
      }),
      description: 'Button that triggers an action',
    },

    // Container for layout
    Container: {
      props: z.object({
        layout: z.enum(['vertical', 'horizontal', 'grid']).default('vertical'),
        gap: z.number().optional().default(4),
        columns: z.number().optional().describe('For grid layout'),
      }),
      description: 'Container for grouping and laying out other components',
    },
  },

  // Actions that AI can trigger through ActionButton
  actions: {
    save_analysis: {
      params: z.object({
        analysisType: z.enum(['deal', 'market', 'comparison']),
        title: z.string(),
        data: z.record(z.unknown()),
      }),
      description: 'Save the current analysis to user\'s saved reports',
    },

    export_pdf: {
      params: z.object({
        title: z.string(),
        sections: z.array(z.string()).optional(),
        includeCharts: z.boolean().optional().default(true),
      }),
      description: 'Export the current view as a PDF report',
    },

    add_to_watchlist: {
      params: z.object({
        parkId: z.string(),
        notes: z.string().optional(),
      }),
      description: 'Add a park to the user\'s watchlist',
    },

    navigate_to_park: {
      params: z.object({
        parkId: z.string(),
      }),
      description: 'Navigate to the park detail page',
    },

    refresh_data: {
      params: z.object({
        dataType: z.enum(['market', 'parks', 'all']),
        filters: z.record(z.unknown()).optional(),
      }),
      description: 'Refresh data with optional filters',
    },
  },
});

// Export the catalog type for use in components
export type UICatalog = typeof uiCatalog;
