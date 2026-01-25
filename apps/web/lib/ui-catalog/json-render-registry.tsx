'use client';

/**
 * JSON-Render Component Registry
 *
 * Maps json-render element types to React components for rendering.
 */

import type { UIElement } from '@json-render/core';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Import our existing components
import { AlertBanner } from './components/alert-banner';
import { BarChart, LineChart } from './components/charts';
import { ComparisonTable } from './components/comparison-table';
import { DealSummary } from './components/deal-summary';
import { MarketSnapshot } from './components/market-snapshot';
import { ParkCard } from './components/park-card';
import { Stat } from './components/stat';
import { StatsGroup } from './components/stats-group';
import { Table } from './components/table';

/**
 * Props passed to each component by json-render
 */
interface ComponentProps {
  element: UIElement;
  children?: React.ReactNode;
  onAction?: (actionName: string, params: Record<string, unknown>) => void;
}

/**
 * Component registry mapping element types to React components
 */
export const componentRegistry: Record<
  string,
  React.ComponentType<ComponentProps>
> = {
  Stat: ({ element }) => (
    <Stat
      data={{
        label: element.props.label as string,
        value: element.props.value as string | number,
        unit: element.props.unit as string | undefined,
        icon: element.props.icon as 'dollar' | 'percent' | 'home' | 'users' | 'chart' | 'alert' | undefined,
        change: element.props.change as { value: number; direction: 'up' | 'down' | 'neutral'; period?: string } | undefined,
      }}
    />
  ),

  StatsGroup: ({ element }) => (
    <StatsGroup
      data={{
        stats: element.props.stats as Array<{
          label: string;
          value: string | number;
          unit?: string;
          icon?: 'dollar' | 'percent' | 'home' | 'users' | 'chart' | 'alert';
          change?: { value: number; direction: 'up' | 'down' | 'neutral'; period?: string };
        }>,
      }}
    />
  ),

  Table: ({ element }) => (
    <Table
      data={{
        title: element.props.title as string | undefined,
        columns: element.props.columns as Array<{ key: string; header: string; align?: 'left' | 'center' | 'right' }>,
        data: element.props.data as Array<Record<string, string | number | null>>,
        striped: element.props.striped as boolean | undefined,
      }}
    />
  ),

  BarChart: ({ element }) => (
    <BarChart
      data={{
        title: element.props.title as string | undefined,
        data: element.props.data as Array<{ name: string; value: number; fill?: string }>,
        xAxisLabel: element.props.xAxisLabel as string | undefined,
        yAxisLabel: element.props.yAxisLabel as string | undefined,
        height: element.props.height as number | undefined,
      }}
    />
  ),

  LineChart: ({ element }) => (
    <LineChart
      data={{
        title: element.props.title as string | undefined,
        data: element.props.data as Array<{ name: string; [key: string]: string | number }>,
        lines: element.props.lines as Array<{ dataKey: string; name?: string; color?: string }>,
        xAxisLabel: element.props.xAxisLabel as string | undefined,
        yAxisLabel: element.props.yAxisLabel as string | undefined,
        height: element.props.height as number | undefined,
      }}
    />
  ),

  ParkCard: ({ element, onAction }) => (
    <ParkCard
      data={{
        parkId: element.props.parkId as string,
        name: element.props.name as string,
        address: element.props.address as string,
        city: element.props.city as string,
        county: element.props.county as string,
        lotCount: element.props.lotCount as number | null,
        distressScore: element.props.distressScore as number | null,
        totalTaxOwed: element.props.totalTaxOwed as number | undefined,
        clickable: element.props.clickable as boolean | undefined,
      }}
      onClick={
        onAction && element.props.clickable !== false
          ? () => onAction('navigate_to_park', { parkId: element.props.parkId })
          : undefined
      }
    />
  ),

  DealSummary: ({ element }) => (
    <DealSummary
      data={{
        parkName: element.props.parkName as string,
        metrics: element.props.metrics as {
          capRate?: number;
          cashOnCash?: number;
          dscr?: number;
          noi?: number;
          pricePerLot?: number;
        },
        recommendation: element.props.recommendation as 'strong-buy' | 'buy' | 'hold' | 'avoid',
        highlights: element.props.highlights as string[],
        concerns: element.props.concerns as string[],
      }}
    />
  ),

  MarketSnapshot: ({ element }) => (
    <MarketSnapshot
      data={{
        county: element.props.county as string,
        fmr: element.props.fmr as { twoBedroom: number; suggestedLotRent: { low: number; high: number } } | undefined,
        demographics: element.props.demographics as { population: number; medianIncome: number; mobileHomesPercent?: number } | undefined,
        employment: element.props.employment as { unemploymentRate: number; trend?: 'improving' | 'stable' | 'declining' } | undefined,
        insights: element.props.insights as string[],
      }}
    />
  ),

  AlertBanner: ({ element }) => (
    <AlertBanner
      data={{
        variant: element.props.variant as 'info' | 'success' | 'warning' | 'error',
        title: element.props.title as string | undefined,
        message: element.props.message as string,
        dismissible: element.props.dismissible as boolean | undefined,
      }}
    />
  ),

  ComparisonTable: ({ element }) => (
    <ComparisonTable
      data={{
        title: element.props.title as string | undefined,
        items: element.props.items as Array<{ name: string; metrics: Record<string, string | number | null> }>,
        metricLabels: element.props.metricLabels as Record<string, string>,
        highlightBest: element.props.highlightBest as boolean | undefined,
      }}
    />
  ),

  ActionButton: ({ element, onAction }) => {
    const variant = (element.props.variant as 'default' | 'secondary' | 'outline' | 'destructive') || 'default';

    const handleClick = () => {
      if (!onAction) return;

      const confirmMessage = element.props.confirmMessage as string | undefined;
      if (confirmMessage) {
        if (window.confirm(confirmMessage)) {
          onAction(
            element.props.action as string,
            (element.props.params as Record<string, unknown>) || {}
          );
        }
      } else {
        onAction(
          element.props.action as string,
          (element.props.params as Record<string, unknown>) || {}
        );
      }
    };

    return (
      <Button variant={variant} onClick={handleClick}>
        {element.props.label as string}
      </Button>
    );
  },

  Container: ({ element, children }) => {
    const layout = (element.props.layout as 'vertical' | 'horizontal' | 'grid') || 'vertical';
    const gap = (element.props.gap as number) || 4;
    const columns = element.props.columns as number | undefined;

    return (
      <div
        className={cn(
          layout === 'vertical' && 'flex flex-col',
          layout === 'horizontal' && 'flex flex-row flex-wrap',
          layout === 'grid' && 'grid',
          `gap-${gap}`
        )}
        style={
          layout === 'grid' && columns
            ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {children}
      </div>
    );
  },
};

/**
 * Get a component from the registry
 */
export function getComponent(type: string): React.ComponentType<ComponentProps> | null {
  return componentRegistry[type] || null;
}
