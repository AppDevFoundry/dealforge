'use client';

import type { RentalResults } from '@dealforge/types';

import { METRIC_EXPLANATIONS } from '@/lib/constants/rental-defaults';

import { RentalResultsCard } from './rental-results-card';

interface RentalResultsDisplayProps {
  results: RentalResults | null;
  learnMode: boolean;
}

export function RentalResultsDisplay({ results, learnMode }: RentalResultsDisplayProps) {
  if (!results) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Key Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Cash on Cash Return"
            value={results.cashOnCashReturn}
            format="percentage"
            explanation={METRIC_EXPLANATIONS.cashOnCashReturn}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Cap Rate"
            value={results.capRate}
            format="percentage"
            explanation={METRIC_EXPLANATIONS.capRate}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Monthly Cash Flow"
            value={results.monthlyCashFlow}
            format="currency"
            explanation={METRIC_EXPLANATIONS.monthlyCashFlow}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Annual Cash Flow"
            value={results.annualCashFlow}
            format="currency"
            explanation={METRIC_EXPLANATIONS.annualCashFlow}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Investment Breakdown */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Investment Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RentalResultsCard
            label="Total Investment"
            value={results.totalInvestment}
            format="currency"
            explanation={METRIC_EXPLANATIONS.totalInvestment}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Loan Amount"
            value={results.loanAmount}
            format="currency"
            explanation={METRIC_EXPLANATIONS.loanAmount}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Monthly Mortgage (P&I)"
            value={results.monthlyMortgage}
            format="currency"
            explanation={METRIC_EXPLANATIONS.monthlyMortgage}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Income & Expenses */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Income & Expenses</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RentalResultsCard
            label="Gross Monthly Income"
            value={results.grossMonthlyIncome}
            format="currency"
            explanation={METRIC_EXPLANATIONS.grossMonthlyIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Effective Gross Income"
            value={results.effectiveGrossIncome}
            format="currency"
            explanation={METRIC_EXPLANATIONS.effectiveGrossIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Monthly Expenses"
            value={results.totalMonthlyExpenses}
            format="currency"
            explanation={METRIC_EXPLANATIONS.totalMonthlyExpenses}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Net Operating Income"
            value={results.netOperatingIncome}
            format="currency"
            explanation={METRIC_EXPLANATIONS.netOperatingIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Debt Service Coverage"
            value={results.debtServiceCoverageRatio}
            format="ratio"
            explanation={METRIC_EXPLANATIONS.debtServiceCoverageRatio}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* First Year Amortization */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Year 1 Amortization</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Principal Paydown (Year 1)"
            value={results.year1PrincipalPaydown}
            format="currency"
            explanation={METRIC_EXPLANATIONS.year1PrincipalPaydown}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Interest Paid (Year 1)"
            value={results.year1InterestPaid}
            format="currency"
            explanation={METRIC_EXPLANATIONS.year1InterestPaid}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* 5-Year Projections */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">5-Year Projections</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="5-Year Equity"
            value={results.fiveYearEquity}
            format="currency"
            explanation={METRIC_EXPLANATIONS.fiveYearEquity}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="5-Year Total Return"
            value={results.fiveYearTotalReturn}
            format="percentage"
            explanation={METRIC_EXPLANATIONS.fiveYearTotalReturn}
            learnMode={learnMode}
          />
        </div>
      </section>
    </div>
  );
}
