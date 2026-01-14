'use client';

import { HelpCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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

function getValueColorClass(value: number, format: FormatType): string {
  if (format === 'currency') {
    if (value > 0) return 'text-success';
    if (value < 0) return 'text-destructive';
  }
  return '';
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
  const valueColorClass = getValueColorClass(value, format);

  return (
    <Card className={highlight ? 'border-primary/50 bg-primary/5' : ''}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {label}
          {!learnMode && explanation && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="size-3.5 cursor-help text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  {explanation}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold tabular-nums ${valueColorClass}`}>
          {formattedValue}
        </div>
        {learnMode && explanation && (
          <CardDescription className="mt-3 text-xs leading-relaxed">{explanation}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
