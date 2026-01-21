'use client';

import type { MultifamilyResults } from '@dealforge/types';

import { RentalResultsCard } from '@/components/calculators/rental/rental-results-card';
import { Card, CardContent } from '@/components/ui/card';
import { MULTIFAMILY_METRIC_EXPLANATIONS } from '@/lib/constants/multifamily-defaults';
import { formatCurrency } from '@/lib/formatters';

interface MultifamilyResultsDisplayProps {
  results: MultifamilyResults | null;
  learnMode: boolean;
}

export function MultifamilyResultsDisplay({ results, learnMode }: MultifamilyResultsDisplayProps) {
  if (!results) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  const dscrHealthy = results.debtServiceCoverageRatio >= 1.25;
  const dscrWarning =
    results.debtServiceCoverageRatio >= 1.0 && results.debtServiceCoverageRatio < 1.25;

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Key Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Net Operating Income"
            value={results.netOperatingIncome}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.netOperatingIncome}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Cap Rate"
            value={results.capRate}
            format="percentage"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.capRate}
            learnMode={learnMode}
            highlight
          />
          <DscrCard
            dscr={results.debtServiceCoverageRatio}
            healthy={dscrHealthy}
            warning={dscrWarning}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Cash-on-Cash Return"
            value={results.cashOnCashReturn}
            format="percentage"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.cashOnCashReturn}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>

      {/* Income Analysis */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Income Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Gross Potential Income"
            value={results.grossPotentialIncome}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.grossPotentialIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Effective Gross Income"
            value={results.effectiveGrossIncome}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.effectiveGrossIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Other Income (Annual)"
            value={results.totalOtherIncome}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.totalOtherIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Monthly Cash Flow"
            value={results.monthlyCashFlow}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.monthlyCashFlow}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>

      {/* Valuation & Benchmarks */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Valuation & Benchmarks</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Market Value (by Cap)"
            value={results.marketValue}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.marketValue}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Price Per Unit"
            value={results.pricePerUnit}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.pricePerUnit}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Gross Rent Multiplier"
            value={results.grossRentMultiplier}
            format="number"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.grossRentMultiplier}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Expense Ratio"
            value={results.expenseRatioActual}
            format="percentage"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.expenseRatioActual}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Investment Breakdown */}
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Investment Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Total Cash Invested"
            value={results.totalInvestment}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.totalInvestment}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Loan Amount"
            value={results.loanAmount}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.loanAmount}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Monthly Mortgage"
            value={results.monthlyMortgage}
            format="currency"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.monthlyMortgage}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Break-Even Occupancy"
            value={results.breakEvenOccupancy}
            format="percentage"
            explanation={MULTIFAMILY_METRIC_EXPLANATIONS.breakEvenOccupancy}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Summary */}
      <section className="animate-fade-in delay-400">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Annual Summary</h3>
        <Card className="card-premium">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <SummaryRow label="Gross Potential Income" value={results.grossPotentialIncome} />
              <SummaryRow
                label="Vacancy Loss"
                value={results.grossPotentialIncome - results.effectiveGrossIncome}
                muted
              />
              <SummaryRow label="Effective Gross Income" value={results.effectiveGrossIncome} />
              <SummaryRow
                label="Operating Expenses"
                value={results.totalMonthlyExpenses * 12}
                muted
              />
              <div className="border-t pt-3">
                <SummaryRow label="Net Operating Income" value={results.netOperatingIncome} bold />
              </div>
              <SummaryRow label="Debt Service" value={results.monthlyMortgage * 12} muted />
              <div className="border-t pt-3">
                <SummaryRow
                  label="Annual Cash Flow"
                  value={results.annualCashFlow}
                  bold
                  highlight={results.annualCashFlow > 0}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

/**
 * Special card for DSCR with color-coded health indicator
 */
function DscrCard({
  dscr,
  healthy,
  warning,
  learnMode,
}: {
  dscr: number;
  healthy: boolean;
  warning: boolean;
  learnMode: boolean;
}) {
  const borderColor = healthy
    ? 'border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10'
    : warning
      ? 'border-warning/50 bg-warning/5 dark:border-warning/40 dark:bg-warning/10'
      : 'border-destructive/50 bg-destructive/5 dark:border-destructive/40 dark:bg-destructive/10';

  const textColor = healthy ? 'text-success' : warning ? 'text-warning' : 'text-destructive';

  const statusText = healthy
    ? 'Healthy — meets lender requirements'
    : warning
      ? 'Marginal — may not meet lender minimums'
      : 'Below 1.0 — income does not cover debt';

  return (
    <Card className={`transition-all duration-300 hover-lift ${borderColor}`}>
      <CardContent className="pt-5">
        <div className="text-sm font-medium text-muted-foreground">DSCR</div>
        <div className="mt-1">
          <span className={`text-2xl font-bold tabular-nums metric-value ${textColor}`}>
            {dscr.toFixed(2)}x
          </span>
        </div>
        <p className={`mt-2 text-xs font-medium ${textColor}`}>{statusText}</p>
        {learnMode && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {MULTIFAMILY_METRIC_EXPLANATIONS.debtServiceCoverageRatio}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Summary row for the annual breakdown
 */
function SummaryRow({
  label,
  value,
  bold = false,
  highlight = false,
  muted = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
  highlight?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-sm ${bold ? 'font-semibold' : ''} ${muted ? 'text-muted-foreground' : ''}`}
      >
        {label}
      </span>
      <span
        className={`tabular-nums ${bold ? 'font-bold text-base' : 'font-medium text-sm'} ${highlight ? 'text-success' : ''}`}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}
