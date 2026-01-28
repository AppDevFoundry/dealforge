'use client';

/**
 * Streaming UI Components
 *
 * React components for rendering AI-generated UI with progressive streaming.
 */

import type { Action, UITree } from '@json-render/core';
import {
  type ComponentRegistry,
  type ComponentRenderProps,
  JSONUIProvider,
  Renderer,
  useUIStream,
} from '@json-render/react';
import { useCallback, useState } from 'react';

// Local type for UIElement to avoid version mismatch between core versions
interface UIElementLocal {
  key: string;
  type: string;
  props: Record<string, unknown>;
  children?: string[];
  parentKey?: string | null;
}
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Import our component implementations
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
 * Component registry mapping json-render types to React components
 */
export const streamingRegistry: ComponentRegistry = {
  Stat: ({ element }: ComponentRenderProps) => (
    <Stat
      data={{
        label: element.props.label as string,
        value: element.props.value as string | number,
        unit: element.props.unit as string | undefined,
        icon: element.props.icon as
          | 'dollar'
          | 'percent'
          | 'home'
          | 'users'
          | 'chart'
          | 'alert'
          | undefined,
        change: element.props.change as
          | { value: number; direction: 'up' | 'down' | 'neutral'; period?: string }
          | undefined,
      }}
    />
  ),

  StatsGroup: ({ element }: ComponentRenderProps) => (
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

  Table: ({ element }: ComponentRenderProps) => (
    <Table
      data={{
        title: element.props.title as string | undefined,
        columns: element.props.columns as Array<{
          key: string;
          header: string;
          align?: 'left' | 'center' | 'right';
        }>,
        data: element.props.data as Array<Record<string, string | number | null>>,
        striped: element.props.striped as boolean | undefined,
      }}
    />
  ),

  BarChart: ({ element }: ComponentRenderProps) => (
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

  LineChart: ({ element }: ComponentRenderProps) => (
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

  ParkCard: ({ element, onAction }: ComponentRenderProps) => (
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
          ? () => onAction({ name: 'navigate_to_park', params: { parkId: element.props.parkId } })
          : undefined
      }
    />
  ),

  DealSummary: ({ element }: ComponentRenderProps) => (
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

  MarketSnapshot: ({ element }: ComponentRenderProps) => (
    <MarketSnapshot
      data={{
        county: element.props.county as string,
        fmr: element.props.fmr as
          | { twoBedroom: number; suggestedLotRent: { low: number; high: number } }
          | undefined,
        demographics: element.props.demographics as
          | { population: number; medianIncome: number; mobileHomesPercent?: number }
          | undefined,
        employment: element.props.employment as
          | { unemploymentRate: number; trend?: 'improving' | 'stable' | 'declining' }
          | undefined,
        insights: element.props.insights as string[],
      }}
    />
  ),

  AlertBanner: ({ element }: ComponentRenderProps) => (
    <AlertBanner
      data={{
        variant: element.props.variant as 'info' | 'success' | 'warning' | 'error',
        title: element.props.title as string | undefined,
        message: element.props.message as string,
        dismissible: element.props.dismissible as boolean | undefined,
      }}
    />
  ),

  ComparisonTable: ({ element }: ComponentRenderProps) => (
    <ComparisonTable
      data={{
        title: element.props.title as string | undefined,
        items: element.props.items as Array<{
          name: string;
          metrics: Record<string, string | number | null>;
        }>,
        metricLabels: element.props.metricLabels as Record<string, string>,
        highlightBest: element.props.highlightBest as boolean | undefined,
      }}
    />
  ),

  ActionButton: ({ element, onAction }: ComponentRenderProps) => {
    const variant =
      (element.props.variant as 'default' | 'secondary' | 'outline' | 'destructive') || 'default';

    const handleClick = () => {
      if (!onAction) return;

      const confirmMessage = element.props.confirmMessage as string | undefined;
      if (confirmMessage) {
        if (window.confirm(confirmMessage)) {
          onAction({
            name: element.props.action as string,
            params: (element.props.params as Record<string, unknown>) || {},
          });
        }
      } else {
        onAction({
          name: element.props.action as string,
          params: (element.props.params as Record<string, unknown>) || {},
        });
      }
    };

    return (
      <Button variant={variant} onClick={handleClick}>
        {element.props.label as string}
      </Button>
    );
  },

  Container: ({ element, children }: ComponentRenderProps) => {
    const layout = (element.props.layout as 'vertical' | 'horizontal' | 'grid') || 'vertical';
    const gap = (element.props.gap as number) || 4;
    const columns = element.props.columns as number | undefined;

    return (
      <div
        className={cn(
          layout === 'vertical' && 'flex flex-col',
          layout === 'horizontal' && 'flex flex-row flex-wrap',
          layout === 'grid' && 'grid'
        )}
        style={{
          gap: `${gap * 4}px`,
          ...(layout === 'grid' && columns
            ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
            : {}),
        }}
      >
        {children}
      </div>
    );
  },
};

/**
 * Props for StreamingUIRenderer
 */
interface StreamingUIRendererProps {
  /** The UI tree to render */
  tree: UITree | null;
  /** Whether currently streaming */
  isStreaming?: boolean;
  /** Action handlers */
  onAction?: (action: Action) => void;
  /** Class name for the container */
  className?: string;
}

/**
 * Normalize a UI tree to ensure children arrays are valid
 */
function normalizeTree(tree: UITree): UITree {
  const normalizedElements: Record<string, UIElementLocal> = {};

  for (const [key, element] of Object.entries(tree.elements)) {
    normalizedElements[key] = {
      ...element,
      // Ensure children is always an array
      children: Array.isArray(element.children)
        ? element.children
        : element.children
          ? [element.children as unknown as string]
          : undefined,
    };
  }

  return {
    root: tree.root,
    elements: normalizedElements,
  };
}

/**
 * Renders a UI tree with streaming support
 */
export function StreamingUIRenderer({
  tree,
  isStreaming = false,
  className,
}: StreamingUIRendererProps) {
  const router = useRouter();

  // Default action handlers
  const actionHandlers: Record<
    string,
    (params: Record<string, unknown>) => Promise<unknown> | unknown
  > = {
    navigate_to_park: async (params) => {
      if (params.parkId) {
        router.push(`/parks/${params.parkId}`);
      }
    },
    save_analysis: async (params) => {
      console.log('Save analysis:', params);
      // TODO: Implement save to database
      alert('Analysis saved! (Demo)');
    },
    export_pdf: async (params) => {
      console.log('Export PDF:', params);
      // TODO: Implement PDF export
      alert('PDF export started! (Demo)');
    },
    add_to_watchlist: async (params) => {
      console.log('Add to watchlist:', params);
      // TODO: Implement watchlist
      alert('Added to watchlist! (Demo)');
    },
    refresh_data: async (params) => {
      console.log('Refresh data:', params);
      // TODO: Implement data refresh
    },
  };

  if (!tree) {
    return null;
  }

  // Normalize tree to handle malformed children
  const normalizedTree = normalizeTree(tree);

  return (
    <JSONUIProvider
      registry={streamingRegistry}
      actionHandlers={actionHandlers}
      navigate={(path) => router.push(path)}
    >
      <div className={cn('space-y-4', className)}>
        <Renderer tree={normalizedTree} registry={streamingRegistry} loading={isStreaming} />
      </div>
    </JSONUIProvider>
  );
}

/**
 * Return type for useStreamingUI hook
 */
interface UseStreamingUIReturn {
  tree: UITree | null;
  isStreaming: boolean;
  error: Error | null;
  generate: (prompt: string, context?: Record<string, unknown>) => Promise<void>;
  clear: () => void;
}

/**
 * Hook for streaming UI generation
 */
export function useStreamingUI(): UseStreamingUIReturn {
  const [lastTree, setLastTree] = useState<UITree | null>(null);

  const { tree, isStreaming, error, send, clear } = useUIStream({
    api: '/api/ui-stream',
    onComplete: (completedTree) => {
      setLastTree(completedTree);
    },
    onError: (err) => {
      console.error('UI streaming error:', err);
    },
  });

  const generate = useCallback(
    async (prompt: string, context?: Record<string, unknown>) => {
      await send(prompt, context);
    },
    [send]
  );

  return {
    tree: tree || lastTree,
    isStreaming,
    error,
    generate,
    clear,
  };
}

/**
 * Demo component showing streaming UI generation
 */
export function StreamingUIDemo() {
  const { tree, isStreaming, error, generate, clear } = useStreamingUI();
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      generate(prompt);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the UI you want..."
          className="flex-1 px-3 py-2 border rounded-md"
          disabled={isStreaming}
        />
        <Button type="submit" disabled={isStreaming || !prompt.trim()}>
          {isStreaming ? 'Generating...' : 'Generate'}
        </Button>
        <Button type="button" variant="outline" onClick={clear} disabled={isStreaming}>
          Clear
        </Button>
      </form>

      {error && (
        <AlertBanner
          data={{
            variant: 'error',
            title: 'Generation Error',
            message: error.message,
          }}
        />
      )}

      <StreamingUIRenderer tree={tree} isStreaming={isStreaming} />
    </div>
  );
}
