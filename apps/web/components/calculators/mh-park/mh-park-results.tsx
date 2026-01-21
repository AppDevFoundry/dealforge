'use client';

import type { MhParkCalculatorInputs, MhParkCalculatorResults } from '@dealforge/types';
import { Home, TrendingUp } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import {
  MH_PARK_DSCR_THRESHOLDS,
  MH_PARK_METRIC_EXPLANATIONS,
} from '@/lib/constants/mh-park-defaults';
import { formatCurrency, formatPercentage, formatRatio } from '@/lib/formatters';

import { MhParkResultsCard } from './mh-park-results-card';

interface MhParkResultsDisplayProps {
  results: MhParkCalculatorResults | null;
  inputs: MhParkCalculatorInputs | null;
  learnMode: boolean;
}

function getDscrStatus(dscr: number): 'excellent' | 'good' | 'acceptable' | 'risky' | 'danger' {
  if (dscr >= MH_PARK_DSCR_THRESHOLDS.excellent) return 'excellent';
  if (dscr >= MH_PARK_DSCR_THRESHOLDS.good) return 'good';
  if (dscr >= MH_PARK_DSCR_THRESHOLDS.acceptable) return 'acceptable';
  if (dscr >= MH_PARK_DSCR_THRESHOLDS.risky) return 'risky';
  return 'danger';
}

function getDscrColor(status: string): string {
  switch (status) {
    case 'excellent':
      return 'text-success';
    case 'good':
      return 'text-success/80';
    case 'acceptable':
      return 'text-warning';
    case 'risky':
      return 'text-warning';
    default:
      return 'text-destructive';
  }
}

export function MhParkResultsDisplay({
  results,
  inputs,
  learnMode,
}: MhParkResultsDisplayProps) {
  if (!results || !inputs) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  const dscrStatus = getDscrStatus(results.debtServiceCoverageRatio);
  const dscrColor = getDscrColor(dscrStatus);
  const isPositiveCashFlow = results.annualCashFlow > 0;

  return (
    <div className="space-y-8">
      {/* Key Metrics Highlight */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Key Metrics</h3>
        <Card
          className={`relative overflow-hidden ${
            isPositiveCashFlow
              ? 'border-success bg-success/5 dark:border-success/50 dark:bg-success/10'
              : 'border-destructive bg-destructive/5 dark:border-destructive/50 dark:bg-destructive/10'
          }`}
        >
          {isPositiveCashFlow && (
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-success/10" />
          )}
          <CardContent className="pt-6 relative">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* NOI - Primary Metric */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Net Operating Income
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold tabular-nums text-primary">
                    {formatCurrency(results.netOperatingIncome)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(results.noiPerLot)}/lot/yr
                </div>
                {learnMode && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {MH_PARK_METRIC_EXPLANATIONS.netOperatingIncome}
                  </p>
                )}
              </div>

              {/* Cap Rate */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Cap Rate</div>
                <div className="text-2xl font-bold tabular-nums">
                  {formatPercentage(results.capRate)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Market: {formatPercentage(inputs.marketCapRate)}
                </div>
              </div>

              {/* DSCR */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">DSCR</div>
                <div className={`text-2xl font-bold tabular-nums ${dscrColor}`}>
                  {formatRatio(results.debtServiceCoverageRatio)}
                </div>
                <div className={`text-xs mt-1 ${dscrColor}`}>
                  {dscrStatus === 'excellent' && 'Excellent coverage'}
                  {dscrStatus === 'good' && 'Good coverage'}
                  {dscrStatus === 'acceptable' && 'Acceptable'}
                  {dscrStatus === 'risky' && 'Risky'}
                  {dscrStatus === 'danger' && 'Below breakeven'}
                </div>
              </div>

              {/* Cash on Cash */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Cash on Cash</div>
                <div
                  className={`text-2xl font-bold tabular-nums ${results.cashOnCashReturn > 0 ? 'text-success' : 'text-destructive'}`}
                >
                  {formatPercentage(results.cashOnCashReturn)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  on {formatCurrency(results.totalInvestment)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Cash Flow */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Cash Flow</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            className={`relative overflow-hidden ${
              isPositiveCashFlow
                ? 'border-success/50 bg-success/5'
                : 'border-destructive/50 bg-destructive/5'
            }`}
          >
            <CardContent className="pt-6">
              <div className="text-sm font-medium text-muted-foreground mb-1">Annual Cash Flow</div>
              <div className="flex items-center gap-3">
                <span
                  className={`text-3xl font-bold tabular-nums ${
                    isPositiveCashFlow ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {formatCurrency(results.annualCashFlow)}
                </span>
                {isPositiveCashFlow && <TrendingUp className="size-6 text-success" />}
              </div>
              {learnMode && (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {MH_PARK_METRIC_EXPLANATIONS.annualCashFlow}
                </p>
              )}
            </CardContent>
          </Card>
          <MhParkResultsCard
            label="Monthly Cash Flow"
            value={results.monthlyCashFlow}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.monthlyCashFlow}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Occupancy & Income */}
      <section className="animate-fade-in delay-150">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Occupancy & Income</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <Home className="size-5 text-muted-foreground" />
                <div className="text-sm font-medium text-muted-foreground">Occupancy Rate</div>
              </div>
              <div
                className={`text-2xl font-bold tabular-nums ${
                  results.occupancyRate >= 90
                    ? 'text-success'
                    : results.occupancyRate >= 80
                      ? 'text-warning'
                      : 'text-destructive'
                }`}
              >
                {formatPercentage(results.occupancyRate)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {inputs.occupiedLots} of {inputs.lotCount} lots
              </div>
              {learnMode && (
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  {MH_PARK_METRIC_EXPLANATIONS.occupancyRate}
                </p>
              )}
            </CardContent>
          </Card>
          <MhParkResultsCard
            label="Gross Potential Rent"
            value={results.grossPotentialRent}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.grossPotentialRent}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Effective Gross Income"
            value={results.effectiveGrossIncome}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.effectiveGrossIncome}
            learnMode={learnMode}
            highlight
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <MhParkResultsCard
            label="Vacancy Loss"
            value={results.vacancyLoss}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.vacancyLoss}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Other Income (Annual)"
            value={results.otherIncomeAnnual}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.otherIncomeAnnual}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Expenses */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Expenses</h3>
        <MhParkResultsCard
          label="Total Operating Expenses"
          value={results.totalOperatingExpenses}
          format="currency"
          explanation={MH_PARK_METRIC_EXPLANATIONS.totalOperatingExpenses}
          learnMode={learnMode}
        />
      </section>

      {/* Financing Details */}
      <section className="animate-fade-in delay-250">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Financing Details</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MhParkResultsCard
            label="Loan Amount"
            value={results.loanAmount}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.loanAmount}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Down Payment"
            value={results.downPayment}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.downPayment}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Closing Costs"
            value={results.closingCosts}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.closingCosts}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Total Investment"
            value={results.totalInvestment}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.totalInvestment}
            learnMode={learnMode}
            highlight
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          <MhParkResultsCard
            label="Monthly Debt Service"
            value={results.monthlyDebtService}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.monthlyDebtService}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Annual Debt Service"
            value={results.annualDebtService}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.annualDebtService}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Valuation Metrics */}
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Valuation Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <MhParkResultsCard
            label="Price per Lot"
            value={results.pricePerLot}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.pricePerLot}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Gross Rent Multiplier"
            value={results.grossRentMultiplier}
            format="ratio"
            explanation={MH_PARK_METRIC_EXPLANATIONS.grossRentMultiplier}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Estimated Market Value"
            value={results.estimatedMarketValue}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.estimatedMarketValue}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>
    </div>
  );
}
