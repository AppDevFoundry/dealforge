/**
 * Recharts theme configuration
 * Uses CSS custom properties for light/dark mode support
 */

// These colors reference the CSS variables defined in globals.css
// They're used as HSL values, so we need to wrap them properly
export const chartColors = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  tertiary: 'hsl(var(--chart-3))',
  quaternary: 'hsl(var(--chart-4))',
  quinary: 'hsl(var(--chart-5))',
  positive: 'hsl(var(--chart-positive))',
  negative: 'hsl(var(--chart-negative))',
  neutral: 'hsl(var(--chart-neutral))',
  muted: 'hsl(var(--muted))',
  mutedForeground: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
};

// Predefined color sequences for different chart types
export const chartColorSequence = [
  chartColors.primary,
  chartColors.secondary,
  chartColors.tertiary,
  chartColors.quaternary,
  chartColors.quinary,
];

// Financial chart colors (income/expense)
export const financialColors = {
  income: chartColors.positive,
  expense: chartColors.negative,
  net: chartColors.primary,
  mortgage: 'hsl(var(--chart-2))',
  maintenance: 'hsl(var(--chart-3))',
  taxes: 'hsl(var(--chart-4))',
  insurance: 'hsl(var(--chart-5))',
  vacancy: 'hsl(var(--destructive))',
  capex: 'hsl(var(--warning))',
  management: 'hsl(var(--muted-foreground))',
};

// Common tooltip styles
export const tooltipStyles = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    borderColor: 'hsl(var(--border))',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  labelStyle: {
    color: 'hsl(var(--popover-foreground))',
    fontWeight: 600,
  },
  itemStyle: {
    color: 'hsl(var(--popover-foreground))',
  },
};

// Common axis styles
export const axisStyles = {
  stroke: 'hsl(var(--border))',
  tick: {
    fill: 'hsl(var(--muted-foreground))',
    fontSize: 12,
  },
};
