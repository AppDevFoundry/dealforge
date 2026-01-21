'use client';

import type { BRRRRInputs, BRRRRResults } from '@dealforge/types';
import { CheckCircle2, XCircle } from 'lucide-react';
import dynamic from 'next/dynamic';

import { RentalResultsCard } from '@/components/calculators/rental/rental-results-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BRRRR_METRIC_EXPLANATIONS } from '@/lib/constants/brrrr-defaults';
import { formatCurrency } from '@/lib/formatters';

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
      {/* BRRRR Key Metrics */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">BRRRR Key Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Cash Left in Deal - special styling if <= 0 */}
          <CashLeftInDealCard value={results.cashLeftInDeal} learnMode={learnMode} />
          {results.infiniteReturn ? (
            <CashOnCashInfiniteCard learnMode={learnMode} />
          ) : (
            <RentalResultsCard
              label="Cash on Cash Return"
              value={results.cashOnCashReturn}
              format="percentage"
              explanation={BRRRR_METRIC_EXPLANATIONS.cashOnCashReturn}
              learnMode={learnMode}
              highlight
            />
          )}
          <RentalResultsCard
            label="Monthly Cash Flow"
            value={results.monthlyCashFlow}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.monthlyCashFlow}
            learnMode={learnMode}
            highlight
          />
          {/* Infinite Return indicator */}
          <InfiniteReturnCard infiniteReturn={results.infiniteReturn} learnMode={learnMode} />
        </div>
      </section>

      {/* Refinance Analysis */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Refinance Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RentalResultsCard
            label="Equity at Refinance"
            value={results.equityAtRefi}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.equityAtRefi}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="New Loan Amount"
            value={results.newLoanAmount}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.newLoanAmount}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="New Monthly Payment"
            value={results.newMonthlyPayment}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.newMonthlyPayment}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Investment Breakdown */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Investment Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Total Cash Invested"
            value={results.totalInvestment}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.totalInvestment}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Cash Recovered at Refi"
            value={results.cashRecoveredAtRefi}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.cashRecoveredAtRefi}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="All-In Cost"
            value={results.allInCost}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.allInCost}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Cap Rate"
            value={results.capRate}
            format="percentage"
            explanation={BRRRR_METRIC_EXPLANATIONS.capRate}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Charts */}
      <section className="animate-fade-in delay-300">
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
            totalInvestment={results.totalInvestment}
            loanAmount={results.newLoanAmount}
            purchasePrice={inputs.afterRepairValue}
          />
        </div>
      </section>

      {/* Income & Expenses */}
      <section className="animate-fade-in delay-400">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Income & Expenses</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RentalResultsCard
            label="Gross Monthly Income"
            value={results.grossMonthlyIncome}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.grossMonthlyIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Effective Gross Income"
            value={results.effectiveGrossIncome}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.effectiveGrossIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Monthly Expenses"
            value={results.totalMonthlyExpenses}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.totalMonthlyExpenses}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Net Operating Income"
            value={results.netOperatingIncome}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.netOperatingIncome}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Debt Service Coverage"
            value={results.debtServiceCoverageRatio}
            format="ratio"
            explanation={BRRRR_METRIC_EXPLANATIONS.debtServiceCoverageRatio}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Post-Refinance Amortization */}
      <section className="animate-fade-in delay-500">
        <h3 className="mb-4 text-lg font-semibold headline-premium">
          Post-Refinance Year 1 Amortization
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Principal Paydown (Year 1)"
            value={results.year1PrincipalPaydown}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.year1PrincipalPaydown}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Interest Paid (Year 1)"
            value={results.year1InterestPaid}
            format="currency"
            explanation={BRRRR_METRIC_EXPLANATIONS.year1InterestPaid}
            learnMode={learnMode}
          />
        </div>
      </section>
    </div>
  );
}

/**
 * Special card for Cash Left in Deal with green styling when <= 0
 */
function CashLeftInDealCard({
  value,
  learnMode,
}: {
  value: number;
  learnMode: boolean;
}) {
  const gotMoneyBack = value <= 0;

  return (
    <Card
      className={`
        transition-all duration-300 hover-lift group relative overflow-hidden
        ${
          gotMoneyBack
            ? 'border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10'
            : 'border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
        }
      `}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gotMoneyBack ? 'from-success/5' : 'from-primary/5'} via-transparent ${gotMoneyBack ? 'to-success/5' : 'to-primary/5'} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <CardHeader className="pb-2 relative">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          Cash Left in Deal
          {gotMoneyBack && <CheckCircle2 className="size-4 text-success" />}
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-2">
          <span
            className={`text-2xl font-bold tabular-nums metric-value ${gotMoneyBack ? 'text-success' : ''}`}
          >
            {formatCurrency(value)}
          </span>
        </div>
        {gotMoneyBack && (
          <p className="mt-2 text-xs font-medium text-success">
            All money recovered — infinite return!
          </p>
        )}
        {learnMode && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {BRRRR_METRIC_EXPLANATIONS.cashLeftInDeal}
          </p>
        )}
      </CardContent>
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${gotMoneyBack ? 'via-success' : 'via-primary'} to-transparent opacity-50`}
      />
    </Card>
  );
}

/**
 * Special card showing infinite return status
 */
function InfiniteReturnCard({
  infiniteReturn,
  learnMode,
}: {
  infiniteReturn: boolean;
  learnMode: boolean;
}) {
  return (
    <Card
      className={`
        transition-all duration-300 hover-lift group relative overflow-hidden
        ${
          infiniteReturn
            ? 'border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10'
            : 'border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
        }
      `}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${infiniteReturn ? 'from-success/5' : 'from-primary/5'} via-transparent ${infiniteReturn ? 'to-success/5' : 'to-primary/5'} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <CardHeader className="pb-2 relative">
        <div className="text-sm font-medium text-muted-foreground">Infinite Return</div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-center gap-3">
          {infiniteReturn ? (
            <>
              <CheckCircle2 className="size-7 text-success" />
              <span className="text-2xl font-bold text-success">Yes</span>
            </>
          ) : (
            <>
              <XCircle className="size-7 text-muted-foreground" />
              <span className="text-2xl font-bold text-muted-foreground">No</span>
            </>
          )}
        </div>
        {learnMode && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {BRRRR_METRIC_EXPLANATIONS.infiniteReturn}
          </p>
        )}
      </CardContent>
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${infiniteReturn ? 'via-success' : 'via-primary'} to-transparent opacity-50`}
      />
    </Card>
  );
}

/**
 * Special card for Cash on Cash when infinite return is achieved
 */
function CashOnCashInfiniteCard({ learnMode }: { learnMode: boolean }) {
  return (
    <Card className="transition-all duration-300 hover-lift group relative overflow-hidden border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10">
      <div className="absolute inset-0 bg-gradient-to-br from-success/5 via-transparent to-success/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <CardHeader className="pb-2 relative">
        <div className="text-sm font-medium text-muted-foreground">Cash on Cash Return</div>
      </CardHeader>
      <CardContent className="relative">
        <span className="text-2xl font-bold text-success tabular-nums metric-value">∞</span>
        {learnMode && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {BRRRR_METRIC_EXPLANATIONS.cashOnCashReturn}
          </p>
        )}
      </CardContent>
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-success to-transparent opacity-50" />
    </Card>
  );
}
