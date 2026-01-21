'use client';

import type { FlipInputs, FlipResults } from '@dealforge/types';
import { TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { FLIP_METRIC_EXPLANATIONS } from '@/lib/constants/flip-defaults';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

import { FlipResultsCard, SeventyPercentRuleCard } from './flip-results-card';

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

  const isProfitable = results.netProfit > 0;

  return (
    <div className="space-y-8">
      {/* Profit Highlight */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Profit Analysis</h3>
        <Card
          className={`relative overflow-hidden ${
            isProfitable
              ? 'border-success bg-success/5 dark:border-success/50 dark:bg-success/10'
              : 'border-destructive bg-destructive/5 dark:border-destructive/50 dark:bg-destructive/10'
          }`}
        >
          {isProfitable && (
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-success/10" />
          )}
          <CardContent className="pt-6 relative">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Net Profit - Primary Metric */}
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">Net Profit</div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-4xl font-bold tabular-nums ${
                      isProfitable ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(results.netProfit)}
                  </span>
                  {isProfitable && <TrendingUp className="size-8 text-success" />}
                </div>
                {learnMode && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {FLIP_METRIC_EXPLANATIONS.netProfit}
                  </p>
                )}
              </div>

              {/* ROI */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">ROI</div>
                <div className="text-2xl font-bold tabular-nums">
                  {formatPercentage(results.roi)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  on {formatCurrency(results.totalCashRequired)} cash
                </div>
              </div>

              {/* Annualized ROI */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Annualized ROI</div>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {formatPercentage(results.annualizedRoi)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  over {inputs.holdingPeriodMonths} months
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 70% Rule Check */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Deal Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <SeventyPercentRuleCard
            purchasePrice={inputs.purchasePrice}
            maxAllowableOffer={results.maxAllowableOffer}
            meetsCriteria={results.dealMeetsSeventyPercentRule}
            learnMode={learnMode}
          />
          <FlipResultsCard
            label="Profit Margin"
            value={results.profitMargin}
            format="percentage"
            explanation={FLIP_METRIC_EXPLANATIONS.profitMargin}
            learnMode={learnMode}
            highlight
            status={
              results.profitMargin >= 10
                ? 'positive'
                : results.profitMargin >= 5
                  ? 'warning'
                  : 'negative'
            }
          />
        </div>
      </section>

      {/* Cost Breakdown */}
      <section className="animate-fade-in delay-150">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Cost Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FlipResultsCard
            label="Total Project Cost"
            value={results.totalProjectCost}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.totalProjectCost}
            learnMode={learnMode}
            status="neutral"
          />
          <FlipResultsCard
            label="Cash Required"
            value={results.totalCashRequired}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.totalCashRequired}
            learnMode={learnMode}
            status="neutral"
          />
          <FlipResultsCard
            label="Break-Even Price"
            value={results.breakEvenPrice}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.breakEvenPrice}
            learnMode={learnMode}
            status="neutral"
          />
        </div>
      </section>

      {/* Acquisition Costs */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Acquisition Costs</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FlipResultsCard
            label="Purchase Price"
            value={inputs.purchasePrice}
            format="currency"
            explanation="The agreed purchase price of the property."
            learnMode={learnMode}
            status="neutral"
          />
          <FlipResultsCard
            label="Closing Costs (Buy)"
            value={results.closingCostsBuy}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.closingCostsBuy}
            learnMode={learnMode}
            status="neutral"
          />
          <FlipResultsCard
            label="Rehab Budget"
            value={inputs.rehabCosts}
            format="currency"
            explanation="Total budget for repairs and renovations."
            learnMode={learnMode}
            status="neutral"
          />
        </div>
      </section>

      {/* Financing Details (if using loan) */}
      {inputs.useLoan && results.loanAmount > 0 && (
        <section className="animate-fade-in delay-250">
          <h3 className="mb-4 text-lg font-semibold headline-premium">Financing Details</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FlipResultsCard
              label="Loan Amount"
              value={results.loanAmount}
              format="currency"
              explanation={FLIP_METRIC_EXPLANATIONS.loanAmount}
              learnMode={learnMode}
              status="neutral"
            />
            <FlipResultsCard
              label="Down Payment"
              value={results.downPayment}
              format="currency"
              explanation={FLIP_METRIC_EXPLANATIONS.downPayment}
              learnMode={learnMode}
              status="neutral"
            />
            <FlipResultsCard
              label="Loan Points"
              value={results.loanPoints}
              format="currency"
              explanation={FLIP_METRIC_EXPLANATIONS.loanPoints}
              learnMode={learnMode}
              status="neutral"
            />
            <FlipResultsCard
              label="Total Interest"
              value={results.totalLoanInterest}
              format="currency"
              explanation={FLIP_METRIC_EXPLANATIONS.totalLoanInterest}
              learnMode={learnMode}
              status="neutral"
            />
          </div>
        </section>
      )}

      {/* Holding Costs */}
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Holding Costs</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FlipResultsCard
            label="Monthly Holding Cost"
            value={inputs.holdingCostsMonthly}
            format="currency"
            explanation="Monthly costs for utilities, taxes, insurance, and maintenance during the flip."
            learnMode={learnMode}
            status="neutral"
          />
          <FlipResultsCard
            label="Total Holding Costs"
            value={results.totalHoldingCosts}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.totalHoldingCosts}
            learnMode={learnMode}
            status="neutral"
          />
        </div>
      </section>

      {/* Selling Costs */}
      <section className="animate-fade-in delay-350">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Selling Costs</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FlipResultsCard
            label="Agent Commission"
            value={results.agentCommission}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.agentCommission}
            learnMode={learnMode}
            status="neutral"
          />
          <FlipResultsCard
            label="Closing Costs (Sell)"
            value={results.closingCostsSell}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.closingCostsSell}
            learnMode={learnMode}
            status="neutral"
          />
          <FlipResultsCard
            label="Total Selling Costs"
            value={results.totalSellingCosts}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.totalSellingCosts}
            learnMode={learnMode}
            status="neutral"
          />
        </div>
      </section>

      {/* Profit Summary */}
      <section className="animate-fade-in delay-400">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Profit Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FlipResultsCard
            label="Gross Profit"
            value={results.grossProfit}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.grossProfit}
            learnMode={learnMode}
          />
          <FlipResultsCard
            label="Net Profit"
            value={results.netProfit}
            format="currency"
            explanation={FLIP_METRIC_EXPLANATIONS.netProfit}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>
    </div>
  );
}
