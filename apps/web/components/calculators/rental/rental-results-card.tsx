'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatNumber, formatPercentage, formatRatio } from '@/lib/formatters';

type FormatType = 'currency' | 'percentage' | 'number' | 'ratio';

interface RentalResultsCardProps {
  label: string;
  value: number;
  format: FormatType;
  explanation?: string;
  learnMode: boolean;
  highlight?: boolean;
}

function formatValue(value: number, format: FormatType): string {
  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      return formatPercentage(value);
    case 'ratio':
      return formatRatio(value);
    default:
      return formatNumber(value);
  }
}

export function RentalResultsCard({
  label,
  value,
  format,
  explanation,
  learnMode,
  highlight = false,
}: RentalResultsCardProps) {
  const formattedValue = formatValue(value, format);

  // Determine if the value is positive, negative, or neutral for styling
  const isPositive = format === 'currency' ? value > 0 : format === 'percentage' ? value > 0 : true;
  const isNegative = format === 'currency' ? value < 0 : false;

  return (
    <Card className={highlight ? 'border-primary' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${
            isNegative ? 'text-destructive' : isPositive && format === 'currency' ? '' : ''
          }`}
        >
          {formattedValue}
        </div>
        {learnMode && explanation && (
          <CardDescription className="mt-3 text-xs leading-relaxed">{explanation}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
