'use client';

import { Card, CardContent } from '@/components/ui/card';

interface MhParkResultsCardProps {
  label: string;
  value: number;
  format: 'currency' | 'percentage' | 'number' | 'ratio';
  explanation?: string;
  learnMode?: boolean;
  highlight?: boolean;
}

function formatValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'ratio':
      return `${value.toFixed(2)}x`;
    default:
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0,
      }).format(value);
  }
}

export function MhParkResultsCard({
  label,
  value,
  format,
  explanation,
  learnMode,
  highlight,
}: MhParkResultsCardProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  return (
    <Card className={highlight ? 'border-primary/20' : ''}>
      <CardContent className="pt-4 pb-4">
        <div className="text-sm font-medium text-muted-foreground mb-1">{label}</div>
        <div
          className={`text-2xl font-bold tabular-nums ${
            highlight && isPositive
              ? 'text-green-600 dark:text-green-400'
              : highlight && isNegative
                ? 'text-red-600 dark:text-red-400'
                : ''
          }`}
        >
          {formatValue(value, format)}
        </div>
        {learnMode && explanation && (
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{explanation}</p>
        )}
      </CardContent>
    </Card>
  );
}
