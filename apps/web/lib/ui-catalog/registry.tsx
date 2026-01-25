'use client';

import type { UIElement } from './types';
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
 * Render a single UI element based on its type
 */
export function renderUIElement(element: UIElement, onParkClick?: (parkId: string) => void) {
  const { id, type, ...data } = element;

  switch (type) {
    case 'stat':
      return <Stat key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    case 'stats-group':
      return <StatsGroup key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    case 'table':
      return <Table key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    case 'bar-chart':
      return <BarChart key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    case 'line-chart':
      return <LineChart key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    case 'park-card':
      return (
        <ParkCard
          key={id}
          data={data as Omit<typeof element, 'id' | 'type'>}
          onClick={onParkClick ? () => onParkClick((element as { parkId: string }).parkId) : undefined}
        />
      );

    case 'deal-summary':
      return <DealSummary key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    case 'market-snapshot':
      return <MarketSnapshot key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    case 'alert-banner':
      return <AlertBanner key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    case 'comparison-table':
      return <ComparisonTable key={id} data={data as Omit<typeof element, 'id' | 'type'>} />;

    default:
      console.warn(`Unknown UI element type: ${type}`);
      return null;
  }
}

/**
 * Render an array of UI elements
 */
export function UIElementRenderer({
  elements,
  onParkClick,
  className,
}: {
  elements: UIElement[];
  onParkClick?: (parkId: string) => void;
  className?: string;
}) {
  if (!elements || elements.length === 0) return null;

  return (
    <div className={className ?? 'space-y-4'}>
      {elements.map((element) => renderUIElement(element, onParkClick))}
    </div>
  );
}
