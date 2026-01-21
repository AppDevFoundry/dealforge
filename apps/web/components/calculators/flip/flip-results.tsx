'use client';

import type { FlipInputs, FlipResults } from '@dealforge/types';
import { CheckCircle2, XCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

import { RentalResultsCard } from '@/components/calculators/rental/rental-results-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FLIP_METRIC_EXPLANATIONS } from '@/lib/constants/flip-defaults';
import { formatCurrency } from '@/lib/formatters';

// Lazy load chart component
const FlipCostChart = dynamic(() => import('./flip-cost-chart').then((mod) => mod.FlipCostChart), {
  ssr: false,
  loading: () => (
    <Card className="card-premium overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base headline-premium">Cost Breakdown</CardTitle>
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-64 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  ),
});

interface FlipResultsDisplayProps {
  results: FlipResults | null;
  inputs: FlipInputs | null;
  learnMode: boolean;
}

export function FlipResultsDisplay({ results, inputs, learnMode }: FlipResultsDisplayProps) {
  if (!results || !inputs) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  const dealPassesRule = inputs.purchasePrice <= results.maxAllowableOffer;

  // Calculate cost components for chart
  const holdingCosts = inputs.holdingCostsMonthly * inputs.holdingPeriodMonths;
  const loanAmount = inputs.useLoan ? (inputs.loanAmount ?? 0) : 0;
  const interestRate = inputs.useLoan ? (inputs.interestRate ?? 0) : 0;
  const pointsPercent = inputs.useLoan ? (inputs.pointsPercent ?? 0) : 0;
  const loanCosts = inputs.useLoan
    ? loanAmount * (interestRate / 100 / 12) * inputs.holdingPeriodMonths +
      loanAmount * (pointsPercent / 100)
    : 0;
  const sellingCosts =
    inputs.afterRepairValue * (inputs.agentCommissionPercent / 100) + inputs.closingCostsSell;

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Key Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Net Profit"
            value={results.netProfit}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.netProfit}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="ROI"
            value={results.roi}
            format="percentage"
            explanation={FLIP_METRIC_EXPLANATIONS.roi}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Annualized ROI"
            value={results.annualizedRoi}
            format="percentage"
            explanation={FLIP_METRIC_EXPLANATIONS.annualizedRoi}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Profit Margin"
            value={results.profitMargin}
            format="percentage"
            explanation={FLIP_METRIC_EXPLANATIONS.profitMargin}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>

      {/* 70% Rule Analysis */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">70% Rule Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Max Allowable Offer (MAO)"
            value={results.maxAllowableOffer}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.maxAllowableOffer}
            learnMode={learnMode}
          />
          <SeventyPercentRuleCard
            purchasePrice={inputs.purchasePrice}
            maxAllowableOffer={results.maxAllowableOffer}
            passes={dealPassesRule}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Cost Breakdown */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Cost Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Total Project Cost"
            value={results.totalCosts}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.totalCosts}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Gross Profit"
            value={results.grossProfit}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.grossProfit}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Total Cash Invested"
            value={results.totalInvestment}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.totalInvestment}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Break-Even Sale Price"
            value={results.breakEvenPrice}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.breakEvenPrice}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Visual Analysis */}
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Visual Analysis</h3>
        <FlipCostChart
          closingCostsBuy={inputs.closingCostsBuy}
          rehabCosts={inputs.rehabCosts}
          holdingCosts={holdingCosts}
          sellingCosts={sellingCosts}
          loanCosts={loanCosts}
        />
      </section>
    </div>
  );
}

/**
 * Special card showing 70% Rule pass/fail status
 */
function SeventyPercentRuleCard({
  purchasePrice,
  maxAllowableOffer,
  passes,
  learnMode,
}: {
  purchasePrice: number;
  maxAllowableOffer: number;
  passes: boolean;
  learnMode: boolean;
}) {
  const difference = maxAllowableOffer - purchasePrice;

  return (
    <Card
      className={`
        transition-all duration-300 hover-lift group relative overflow-hidden
        ${
          passes
            ? 'border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10'
            : 'border-destructive/50 bg-destructive/5 dark:border-destructive/40 dark:bg-destructive/10'
        }
      `}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${passes ? 'from-success/5' : 'from-destructive/5'} via-transparent ${passes ? 'to-success/5' : 'to-destructive/5'} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Purchase vs MAO
          {passes ? (
            <CheckCircle2 className="size-4 text-success" />
          ) : (
            <XCircle className="size-4 text-destructive" />
          )}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl font-bold tabular-nums metric-value ${passes ? 'text-success' : 'text-destructive'}`}
          >
            {passes ? 'Passes' : 'Fails'}
          </span>
        </div>
        <p className={`mt-2 text-xs font-medium ${passes ? 'text-success' : 'text-destructive'}`}>
          {passes
            ? `${formatCurrency(difference)} under MAO`
            : `${formatCurrency(Math.abs(difference))} over MAO`}
        </p>
        {learnMode && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            The 70% Rule states your purchase price should be at most 70% of ARV minus rehab costs.
            Deals that pass this rule have a built-in profit margin.
          </p>
        )}
      </CardContent>
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${passes ? 'via-success' : 'via-destructive'} to-transparent opacity-50`}
      />
    </Card>
  );
}
