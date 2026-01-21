'use client';

import type { MhParkInputs, MhParkResults } from '@dealforge/types';

import { MH_PARK_METRIC_EXPLANATIONS } from '@/lib/constants/mh-park-defaults';

import { MhParkResultsCard } from './mh-park-results-card';

interface MhParkResultsDisplayProps {
  results: MhParkResults | null;
  inputs: MhParkInputs | null;
  learnMode: boolean;
}

export function MhParkResultsDisplay({ results, inputs, learnMode }: MhParkResultsDisplayProps) {
  if (!results || !inputs) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Key Metrics</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <MhParkResultsCard
            label="Net Operating Income"
            value={results.netOperatingIncome}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.netOperatingIncome}
            learnMode={learnMode}
            highlight
          />
          <MhParkResultsCard
            label="Cap Rate"
            value={results.capRate}
            format="percentage"
            explanation={MH_PARK_METRIC_EXPLANATIONS.capRate}
            learnMode={learnMode}
            highlight
          />
          <MhParkResultsCard
            label="Cash on Cash Return"
            value={results.cashOnCashReturn}
            format="percentage"
            explanation={MH_PARK_METRIC_EXPLANATIONS.cashOnCashReturn}
            learnMode={learnMode}
            highlight
          />
          <MhParkResultsCard
            label="DSCR"
            value={results.debtServiceCoverageRatio}
            format="ratio"
            explanation={MH_PARK_METRIC_EXPLANATIONS.debtServiceCoverageRatio}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>

      {/* Cash Flow */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Cash Flow</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <MhParkResultsCard
            label="Monthly Cash Flow"
            value={results.monthlyCashFlow}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.monthlyCashFlow}
            learnMode={learnMode}
            highlight
          />
          <MhParkResultsCard
            label="Annual Cash Flow"
            value={results.annualCashFlow}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.annualCashFlow}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Income Breakdown */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Income</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <MhParkResultsCard
            label="Gross Potential Income"
            value={results.grossPotentialIncome}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.grossPotentialIncome}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Vacancy Loss"
            value={results.vacancyLoss}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.vacancyLoss}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Effective Gross Income"
            value={results.effectiveGrossIncome}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.effectiveGrossIncome}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Operating Expenses"
            value={results.totalOperatingExpenses}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.totalOperatingExpenses}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Financing */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Financing</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <MhParkResultsCard
            label="Loan Amount"
            value={results.loanAmount}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.loanAmount}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Total Investment"
            value={results.totalInvestment}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.totalInvestment}
            learnMode={learnMode}
          />
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

      {/* Per-Lot Metrics */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Per-Lot Metrics</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <MhParkResultsCard
            label="NOI Per Lot"
            value={results.noiPerLot}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.noiPerLot}
            learnMode={learnMode}
          />
          <MhParkResultsCard
            label="Price Per Lot"
            value={results.pricePerLot}
            format="currency"
            explanation={MH_PARK_METRIC_EXPLANATIONS.pricePerLot}
            learnMode={learnMode}
          />
        </div>
      </section>
    </div>
  );
}
