'use client';

import { CheckCircle, HelpCircle, Home, TrendingDown, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency, formatNumber, formatPercentage, formatRatio } from '@/lib/formatters';

type FormatType = 'currency' | 'percentage' | 'number' | 'ratio';

interface HouseHackResultsCardProps {
  label: string;
  value: number;
  format: FormatType;
  explanation?: string;
  learnMode: boolean;
  highlight?: boolean;
  status?: 'positive' | 'negative' | 'warning' | 'neutral';
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
  format: FormatType,
  status?: 'positive' | 'negative' | 'warning' | 'neutral'
): {
  colorClass: string;
  glowClass: string;
  icon: typeof TrendingUp | typeof TrendingDown | null;
} {
  if (status === 'positive') {
    return { colorClass: 'text-success', glowClass: 'glow-positive', icon: TrendingUp };
  }
  if (status === 'negative') {
    return { colorClass: 'text-destructive', glowClass: 'glow-negative', icon: TrendingDown };
  }
  if (status === 'warning') {
    return { colorClass: 'text-warning', glowClass: '', icon: null };
  }

  if (format === 'currency') {
    if (value > 0)
      return { colorClass: 'text-success', glowClass: 'glow-positive', icon: TrendingUp };
    if (value < 0)
      return { colorClass: 'text-destructive', glowClass: 'glow-negative', icon: TrendingDown };
  }
  return { colorClass: '', glowClass: '', icon: null };
}

export function HouseHackResultsCard({
  label,
  value,
  format,
  explanation,
  learnMode,
  highlight = false,
  status,
}: HouseHackResultsCardProps) {
  const formattedValue = formatValue(value, format);
  const { colorClass, glowClass, icon: TrendIcon } = getValueStyling(value, format, status);

  return (
    <Card
      className={`
        transition-all duration-300 hover-lift group relative overflow-hidden
        ${highlight ? 'border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10' : ''}
        ${glowClass}
      `}
    >
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

      {highlight && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      )}
    </Card>
  );
}

interface LiveForFreeCardProps {
  netHousingCost: number;
  savingsVsRenting: number;
  livesForFree: boolean;
  learnMode: boolean;
}

export function LiveForFreeCard({
  netHousingCost,
  savingsVsRenting,
  livesForFree,
  learnMode,
}: LiveForFreeCardProps) {
  return (
    <Card
      className={`
        transition-all duration-300 hover-lift group relative overflow-hidden
        ${
          livesForFree
            ? 'border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10'
            : 'border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
        }
      `}
    >
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          House Hack Status
          {!learnMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 cursor-help text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                When rental income covers all housing costs, you live for free! This is the ultimate
                house hack goal.
              </TooltipContent>
            </Tooltip>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-3">
          {livesForFree ? (
            <div className="flex size-12 items-center justify-center rounded-full bg-success/20">
              <CheckCircle className="size-7 text-success" />
            </div>
          ) : (
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/20">
              <Home className="size-7 text-primary" />
            </div>
          )}
          <div>
            <div
              className={`text-lg font-bold ${livesForFree ? 'text-success' : 'text-foreground'}`}
            >
              {livesForFree ? 'Live For Free!' : 'Reduced Housing Cost'}
            </div>
            <div className="text-sm text-muted-foreground">
              {livesForFree ? (
                <span className="text-success">
                  +{formatCurrency(Math.abs(netHousingCost))}/mo positive cash flow
                </span>
              ) : (
                <span>
                  Pay {formatCurrency(netHousingCost)}/mo (save {formatCurrency(savingsVsRenting)})
                </span>
              )}
            </div>
          </div>
        </div>
        {learnMode && (
          <CardDescription className="mt-3 text-xs leading-relaxed">
            When rental income covers all housing costs (mortgage + expenses), you achieve the
            ultimate house hack: living for free. Any excess becomes positive monthly cash flow.
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}

interface RentCoverageCardProps {
  rentCoverageRatio: number;
  effectiveRentalIncome: number;
  grossMonthlyCost: number;
  learnMode: boolean;
}

export function RentCoverageCard({
  rentCoverageRatio,
  effectiveRentalIncome,
  grossMonthlyCost,
  learnMode,
}: RentCoverageCardProps) {
  const coveragePercent = rentCoverageRatio * 100;
  const isFullyCovered = coveragePercent >= 100;

  return (
    <Card className="transition-all duration-300 hover-lift group relative overflow-hidden">
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Rent Coverage
          {!learnMode && (
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="size-3.5 cursor-help text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs text-xs">
                What percentage of your total housing costs are covered by rental income from
                tenants.
              </TooltipContent>
            </Tooltip>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-3">
        <div className="flex items-center justify-between">
          <span
            className={`text-2xl font-bold tabular-nums ${isFullyCovered ? 'text-success' : 'text-primary'}`}
          >
            {formatPercentage(coveragePercent)}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(effectiveRentalIncome)} / {formatCurrency(grossMonthlyCost)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFullyCovered ? 'bg-success' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(coveragePercent, 100)}%` }}
          />
        </div>

        {learnMode && (
          <CardDescription className="text-xs leading-relaxed">
            Rental income covers {formatPercentage(coveragePercent)} of your total housing costs. At
            100%+, you live for free!
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
