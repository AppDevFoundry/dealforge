/**
 * UI Catalog Types
 *
 * TypeScript interfaces for dynamic UI components rendered in AI responses.
 */

/**
 * Base interface for all UI elements
 */
export interface UIElementBase {
  id: string;
  type: string;
}

/**
 * Stat component - displays a single metric with optional change indicator
 */
export interface StatElement extends UIElementBase {
  type: 'stat';
  label: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period?: string;
  };
  icon?: 'dollar' | 'percent' | 'home' | 'users' | 'chart' | 'alert';
}

/**
 * Stats group - displays multiple stats in a row
 */
export interface StatsGroupElement extends UIElementBase {
  type: 'stats-group';
  stats: Omit<StatElement, 'id' | 'type'>[];
}

/**
 * Table component - displays tabular data
 */
export interface TableElement extends UIElementBase {
  type: 'table';
  title?: string;
  columns: Array<{
    key: string;
    header: string;
    align?: 'left' | 'center' | 'right';
  }>;
  data: Array<Record<string, string | number | null>>;
  striped?: boolean;
}

/**
 * Bar chart component
 */
export interface BarChartElement extends UIElementBase {
  type: 'bar-chart';
  title?: string;
  data: Array<{
    name: string;
    value: number;
    fill?: string;
  }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
}

/**
 * Line chart component
 */
export interface LineChartElement extends UIElementBase {
  type: 'line-chart';
  title?: string;
  data: Array<{
    name: string;
    [key: string]: string | number;
  }>;
  lines: Array<{
    dataKey: string;
    color?: string;
    name?: string;
  }>;
  xAxisLabel?: string;
  yAxisLabel?: string;
  height?: number;
}

/**
 * Park card component - summary of an MH park
 */
export interface ParkCardElement extends UIElementBase {
  type: 'park-card';
  parkId: string;
  name: string;
  address: string;
  city: string;
  county: string;
  lotCount: number | null;
  distressScore: number | null;
  totalTaxOwed?: number;
  clickable?: boolean;
}

/**
 * Deal summary component - analysis results with recommendation
 */
export interface DealSummaryElement extends UIElementBase {
  type: 'deal-summary';
  parkName: string;
  metrics: {
    capRate?: number;
    cashOnCash?: number;
    dscr?: number;
    noi?: number;
    pricePerLot?: number;
  };
  recommendation: 'strong-buy' | 'buy' | 'hold' | 'avoid';
  highlights: string[];
  concerns: string[];
}

/**
 * Market snapshot component - market context summary
 */
export interface MarketSnapshotElement extends UIElementBase {
  type: 'market-snapshot';
  county: string;
  fmr?: {
    twoBedroom: number;
    suggestedLotRent: { low: number; high: number };
  };
  demographics?: {
    population: number;
    medianIncome: number;
    mobileHomesPercent?: number;
  };
  employment?: {
    unemploymentRate: number;
    trend?: 'improving' | 'stable' | 'declining';
  };
  insights: string[];
}

/**
 * Alert banner component - info/warning/error notifications
 */
export interface AlertBannerElement extends UIElementBase {
  type: 'alert-banner';
  variant: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  dismissible?: boolean;
}

/**
 * Comparison table component - side-by-side metrics comparison
 */
export interface ComparisonTableElement extends UIElementBase {
  type: 'comparison-table';
  title?: string;
  items: Array<{
    name: string;
    metrics: Record<string, string | number | null>;
  }>;
  metricLabels: Record<string, string>;
  highlightBest?: boolean;
}

/**
 * Union type of all UI elements
 */
export type UIElement =
  | StatElement
  | StatsGroupElement
  | TableElement
  | BarChartElement
  | LineChartElement
  | ParkCardElement
  | DealSummaryElement
  | MarketSnapshotElement
  | AlertBannerElement
  | ComparisonTableElement;

/**
 * Type guard functions
 */
export function isStatElement(el: UIElement): el is StatElement {
  return el.type === 'stat';
}

export function isStatsGroupElement(el: UIElement): el is StatsGroupElement {
  return el.type === 'stats-group';
}

export function isTableElement(el: UIElement): el is TableElement {
  return el.type === 'table';
}

export function isBarChartElement(el: UIElement): el is BarChartElement {
  return el.type === 'bar-chart';
}

export function isLineChartElement(el: UIElement): el is LineChartElement {
  return el.type === 'line-chart';
}

export function isParkCardElement(el: UIElement): el is ParkCardElement {
  return el.type === 'park-card';
}

export function isDealSummaryElement(el: UIElement): el is DealSummaryElement {
  return el.type === 'deal-summary';
}

export function isMarketSnapshotElement(el: UIElement): el is MarketSnapshotElement {
  return el.type === 'market-snapshot';
}

export function isAlertBannerElement(el: UIElement): el is AlertBannerElement {
  return el.type === 'alert-banner';
}

export function isComparisonTableElement(el: UIElement): el is ComparisonTableElement {
  return el.type === 'comparison-table';
}
