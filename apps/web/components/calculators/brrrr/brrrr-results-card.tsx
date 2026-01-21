'use client';

import { HelpCircle, Infinity as InfinityIcon, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatNumber, formatPercentage, formatRatio } from '@/lib/formatters';

type FormatType = 'currency' | 'percentage' | 'number' | 'ratio';

interface BRRRRResultsCardProps {
  label: string;
  value: number;
  format: FormatType;
  explanation?: string;
  learnMode: boolean;
  highlight?: boolean;
  infiniteReturn?: boolean;
}

function formatValue(value: number, format: FormatType, infiniteReturn?: boolean): string {
  if (infiniteReturn && (format === 'percentage' || value === Number.POSITIVE_INFINITY)) {
    return '∞';
  }

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percentage':
      // Cap percentage display at 999% for readability
      return formatPercentage(Math.min(value, 999));
    case 'ratio':
      return formatRatio(value);
    default:
      return formatNumber(value);
  }
}

function getValueStyling(
  value: number,
  format: FormatType,
  infiniteReturn?: boolean
): {
  colorClass: string;
  glowClass: string;
  icon: typeof TrendingUp | typeof TrendingDown | typeof InfinityIcon | null;
} {
  if (infiniteReturn) {
    return { colorClass: 'text-success', glowClass: 'glow-positive', icon: InfinityIcon };
  }

  if (format === 'currency') {
    if (value > 0)
      return { colorClass: 'text-success', glowClass: 'glow-positive', icon: TrendingUp };
    if (value < 0)
      return { colorClass: 'text-destructive', glowClass: 'glow-negative', icon: TrendingDown };
  }
  return { colorClass: '', glowClass: '', icon: null };
}

export function BRRRRResultsCard({
  label,
  value,
  format,
  explanation,
  learnMode,
  highlight = false,
  infiniteReturn = false,
}: BRRRRResultsCardProps) {
  const formattedValue = formatValue(value, format, infiniteReturn);
  const { colorClass, glowClass, icon: TrendIcon } = getValueStyling(value, format, infiniteReturn);

  return (
    <Card
      className={`
        transition-all duration-300 hover-lift group relative overflow-hidden
        ${highlight ? 'border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10' : ''}
        ${infiniteReturn ? 'border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10' : ''}
        ${glowClass}
      `}
    >
      {/* Gradient overlay for highlighted cards */}
      {(highlight || infiniteReturn) && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${
            infiniteReturn
              ? 'from-success/5 via-transparent to-success/5'
              : 'from-primary/5 via-transparent to-primary/5'
          } opacity-0 transition-opacity group-hover:opacity-100`}
        />
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
      {(highlight || infiniteReturn) && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${
            infiniteReturn ? 'via-success' : 'via-primary'
          } to-transparent opacity-50`}
        />
      )}
    </Card>
  );
}
