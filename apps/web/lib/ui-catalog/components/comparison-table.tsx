'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import type { ComparisonTableElement } from '../types';

interface ComparisonTableProps {
  data: Omit<ComparisonTableElement, 'id' | 'type'>;
  className?: string;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';

  if (typeof value === 'number') {
    return value.toLocaleString();
  }

  return String(value);
}

function getTrendIcon(a: number, b: number, highlightBest?: boolean) {
  if (!highlightBest) return null;

  const diff = a - b;
  if (Math.abs(diff) < 0.01) {
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  }

  // Higher is better by default
  if (diff > 0) {
    return <ArrowUp className="h-3 w-3 text-green-600" />;
  }
  return <ArrowDown className="h-3 w-3 text-red-600" />;
}

export function ComparisonTable({ data, className }: ComparisonTableProps) {
  const { title, items, metricLabels, highlightBest } = data;

  // Guard against missing data
  if (!items || items.length === 0) {
    return (
      <Card className={cn('', className)}>
        {title && (
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <p className="text-sm text-muted-foreground">No comparison data available</p>
        </CardContent>
      </Card>
    );
  }

  // Get all metric keys from metricLabels or infer from first item
  const metricKeys = metricLabels
    ? Object.keys(metricLabels)
    : items[0]?.metrics
      ? Object.keys(items[0].metrics)
      : [];

  return (
    <Card className={cn('', className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Metric</TableHead>
              {items.map((item, idx) => (
                <TableHead key={idx} className="text-right">
                  {item.name}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {metricKeys.map((metricKey) => (
              <TableRow key={metricKey}>
                <TableCell className="font-medium">
                  {metricLabels?.[metricKey] ?? metricKey}
                </TableCell>
                {items.map((item, itemIdx) => {
                  const value = item.metrics?.[metricKey];
                  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
                  const otherValues = items
                    .filter((_, i) => i !== itemIdx)
                    .map((i) => {
                      const v = i.metrics?.[metricKey];
                      return typeof v === 'number' ? v : parseFloat(String(v));
                    });

                  const avgOther = otherValues.length > 0
                    ? otherValues.reduce((a, b) => a + b, 0) / otherValues.length
                    : numValue;

                  return (
                    <TableCell key={itemIdx} className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span>{formatValue(value)}</span>
                        {!isNaN(numValue) && !isNaN(avgOther) && (
                          getTrendIcon(numValue, avgOther, highlightBest)
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
