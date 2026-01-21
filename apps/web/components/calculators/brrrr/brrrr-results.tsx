'use client';

import type { BRRRRInputs, BRRRRResults } from '@dealforge/types';
import { Infinity as InfinityIcon, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BRRRR_METRIC_EXPLANATIONS } from '@/lib/constants/brrrr-defaults';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

import { BRRRRResultsCard } from './brrrr-results-card';

// Lazy load chart components to reduce initial bundle size
const CashFlowChart = dynamic(
  () => import('@/components/charts/cash-flow-chart').then((mod) => mod.CashFlowChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="10-Year Projection" />,
  }
);

const ExpenseBreakdownChart = dynamic(
  () =>
    import('@/components/charts/expense-breakdown-chart').then((mod) => mod.ExpenseBreakdownChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton title="Monthly Expense Breakdown" />,
  }
);

function ChartSkeleton({ title }: { title: string }) {
  return (
    <Card className="card-premium overflow-hidden">
      <CardHeader className="pb-2">
        <div className="text-base font-semibold headline-premium">{title}</div>
        <div className="h-4 w-48 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-64 animate-pulse rounded bg-muted" />
      </CardContent>
    </Card>
  );
}

interface BRRRRResultsDisplayProps {
  results: BRRRRResults | null;
  inputs: BRRRRInputs | null;
  learnMode: boolean;
}

export function BRRRRResultsDisplay({ results, inputs, learnMode }: BRRRRResultsDisplayProps) {
  if (!results || !inputs) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  // Calculate expense breakdown for the chart
  const monthlyPropertyTaxes = inputs.propertyTaxAnnual / 12;
  const monthlyInsurance = inputs.insuranceAnnual / 12;
  const monthlyMaintenance = (results.grossMonthlyIncome * inputs.maintenancePercent) / 100;
  const monthlyCapex = (results.grossMonthlyIncome * inputs.capexPercent) / 100;
  const monthlyManagement = (results.grossMonthlyIncome * inputs.managementPercent) / 100;
  const monthlyVacancy = (results.grossMonthlyIncome * inputs.vacancyRate) / 100;

  return (
    <div className="space-y-8">
      {/* BRRRR Highlight - The Key Metric */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">BRRRR Analysis</h3>
        <Card
          className={`relative overflow-hidden ${
            results.infiniteReturn
              ? 'border-success bg-success/5 dark:border-success/50 dark:bg-success/10'
              : results.cashLeftInDeal <= results.allInCost * 0.2
                ? 'border-primary bg-primary/5 dark:border-primary/50 dark:bg-primary/10'
                : ''
          }`}
        >
          {results.infiniteReturn && (
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-success/10" />
          )}
          <CardContent className="pt-6 relative">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Cash Left in Deal - Primary Metric */}
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Cash Left in Deal
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-4xl font-bold tabular-nums ${
                      results.infiniteReturn
                        ? 'text-success'
                        : results.cashLeftInDeal <= 0
                          ? 'text-success'
                          : ''
                    }`}
                  >
                    {results.infiniteReturn || results.cashLeftInDeal <= 0
                      ? '$0'
                      : formatCurrency(results.cashLeftInDeal)}
                  </span>
                  {results.infiniteReturn && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-sm font-semibold text-success">
                      <InfinityIcon className="size-4" />
                      Infinite Return
                    </span>
                  )}
                </div>
                {learnMode && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {BRRRR_METRIC_EXPLANATIONS.cashLeftInDeal}
                  </p>
                )}
              </div>

              {/* Cash Recovered */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Cash Recovered</div>
                <div className="text-2xl font-bold tabular-nums">
                  {formatPercentage(Math.min(results.cashRecoveredPercent, 999))}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(results.cashRecoveredAtRefi)} back
                </div>
              </div>

              {/* Equity at Refi */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Equity Captured
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tabular-nums text-success">
                    {formatCurrency(results.equityAtRefi)}
                  </span>
                  <TrendingUp className="size-5 text-success" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Key Metrics (Post-Refinance) */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">
          Key Metrics (Post-Refinance)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <BRRRRResultsCard
            label="Cash on Cash Return"
            value={results.cashOnCashReturn}
            format="percentage"
            explanation={BRRRR_METRIC_EXPLANATIONS.cashOnCashReturn}
            learnMode={learnMode}
            highlight
            infiniteReturn={results.infiniteReturn}
          />
          <BRRRRResultsCard
            label="Monthly Cash Flow"
            value={results.monthlyCashFlow}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.monthlyCashFlow}
            learnMode={learnMode}
            highlight
          />
          <BRRRRResultsCard
            label="Cap Rate (on ARV)"
            value={results.capRate}
            format="percentage"
            explanation={BRRRR_METRIC_EXPLANATIONS.capRate}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Annual Cash Flow"
            value={results.annualCashFlow}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.annualCashFlow}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="animate-fade-in delay-150">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Visual Analysis</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <ExpenseBreakdownChart
            mortgage={results.newMonthlyPayment}
            propertyTaxes={monthlyPropertyTaxes}
            insurance={monthlyInsurance}
            maintenance={monthlyMaintenance}
            vacancy={monthlyVacancy}
            capex={monthlyCapex}
            managementFees={monthlyManagement}
          />
          <CashFlowChart
            annualCashFlow={results.annualCashFlow}
            totalInvestment={
              results.cashLeftInDeal > 0 ? results.cashLeftInDeal : results.allInCost
            }
            loanAmount={results.newLoanAmount}
            purchasePrice={inputs.afterRepairValue}
          />
        </div>
      </section>

      {/* Investment Analysis */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Investment Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BRRRRResultsCard
            label="All-In Cost"
            value={results.allInCost}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.allInCost}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Initial Cash Required"
            value={results.initialDownPayment + inputs.closingCosts + results.initialPointsCost}
            format="currency"
            explanation="Cash needed at purchase: down payment, closing costs, and loan points. Does not include rehab or holding costs."
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Equity at Refinance"
            value={results.equityAtRefi}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.equityAtRefi}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Financing Comparison */}
      <section className="animate-fade-in delay-250">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Financing Comparison</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <BRRRRResultsCard
            label="Initial Loan"
            value={results.initialLoanAmount}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.initialLoanAmount}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Initial Payment"
            value={results.initialMonthlyPayment}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.initialMonthlyPayment}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="New Loan"
            value={results.newLoanAmount}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.newLoanAmount}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="New Payment"
            value={results.newMonthlyPayment}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.newMonthlyPayment}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Income & Expenses */}
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Income & Expenses</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BRRRRResultsCard
            label="Gross Monthly Income"
            value={results.grossMonthlyIncome}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.grossMonthlyIncome}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Effective Gross Income"
            value={results.effectiveGrossIncome}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.effectiveGrossIncome}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Monthly Expenses"
            value={results.totalMonthlyExpenses}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.totalMonthlyExpenses}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Net Operating Income"
            value={results.netOperatingIncome}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.netOperatingIncome}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Debt Service Coverage"
            value={results.debtServiceCoverageRatio}
            format="ratio"
            explanation={BRRRR_METRIC_EXPLANATIONS.debtServiceCoverageRatio}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Year 1 Amortization */}
      <section className="animate-fade-in delay-350">
        <h3 className="mb-4 text-lg font-semibold headline-premium">
          Year 1 Amortization (Post-Refi)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <BRRRRResultsCard
            label="Principal Paydown (Year 1)"
            value={results.year1PrincipalPaydown}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.year1PrincipalPaydown}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="Interest Paid (Year 1)"
            value={results.year1InterestPaid}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.year1InterestPaid}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* 5-Year Projections */}
      <section className="animate-fade-in delay-400">
        <h3 className="mb-4 text-lg font-semibold headline-premium">5-Year Projections</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <BRRRRResultsCard
            label="5-Year Equity"
            value={results.fiveYearEquity}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.fiveYearEquity}
            learnMode={learnMode}
          />
          <BRRRRResultsCard
            label="5-Year Total Return"
            value={results.fiveYearTotalReturn}
            format="percentage"
            explanation={BRRRR_METRIC_EXPLANATIONS.fiveYearTotalReturn}
            learnMode={learnMode}
            infiniteReturn={results.infiniteReturn}
          />
        </div>
      </section>
    </div>
  );
}
