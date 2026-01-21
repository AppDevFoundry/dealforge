'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
}

export function TrendIndicator({ value }: TrendIndicatorProps) {
  if (Math.abs(value) < 0.5) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Minus className="size-3" />
        {value.toFixed(1)}%
      </span>
    );
  }

  if (value > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <TrendingUp className="size-3" />+{value.toFixed(1)}%
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
      <TrendingDown className="size-3" />
      {value.toFixed(1)}%
    </span>
  );
}
