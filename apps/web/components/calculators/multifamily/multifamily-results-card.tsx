'use client';

import { HelpCircle, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatNumber, formatPercentage, formatRatio } from '@/lib/formatters';

type FormatType = 'currency' | 'percentage' | 'number' | 'ratio';

interface MultifamilyResultsCardProps {
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

function getValueStyling(
  value: number,
  format: FormatType
): { colorClass: string; glowClass: string; icon: typeof TrendingUp | typeof TrendingDown | null } {
  if (format === 'currency') {
    if (value > 0)
      return { colorClass: 'text-success', glowClass: 'glow-positive', icon: TrendingUp };
    if (value < 0)
      return { colorClass: 'text-destructive', glowClass: 'glow-negative', icon: TrendingDown };
  }
  return { colorClass: '', glowClass: '', icon: null };
}

export function MultifamilyResultsCard({
  label,
  value,
  format,
  explanation,
  learnMode,
  highlight = false,
}: MultifamilyResultsCardProps) {
  const formattedValue = formatValue(value, format);
  const { colorClass, glowClass, icon: TrendIcon } = getValueStyling(value, format);

  return (
    <Card
      className={`
        transition-all duration-300 hover-lift group relative overflow-hidden
        ${highlight ? 'border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10' : ''}
        ${glowClass}
      `}
    >
      {/* Gradient overlay for highlighted cards */}
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
      )}

      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          {label}
          {!learnMode && explanation && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 cursor-help text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                {explanation}
              </TooltipContent>
            </Tooltip>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-2">
          <span className={`text-2xl font-bold tabular-nums metric-value ${colorClass}`}>
            {formattedValue}
          </span>
          {TrendIcon && <TrendIcon className={`size-5 ${colorClass} opacity-70`} />}
        </div>
        {learnMode && explanation && (
          <CardDescription className="mt-3 text-xs leading-relaxed">{explanation}</CardDescription>
        )}
      </CardContent>

      {/* Bottom accent line for highlighted cards */}
      {highlight && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      )}
    </Card>
  );
}
