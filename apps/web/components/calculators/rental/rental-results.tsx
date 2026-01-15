'use client';

import type { RentalInputs, RentalResults } from '@dealforge/types';

import { CashFlowChart } from '@/components/charts/cash-flow-chart';
import { ExpenseBreakdownChart } from '@/components/charts/expense-breakdown-chart';
import { METRIC_EXPLANATIONS } from '@/lib/constants/rental-defaults';

import { RentalResultsCard } from './rental-results-card';

interface RentalResultsDisplayProps {
  results: RentalResults | null;
  inputs: RentalInputs | null;
  learnMode: boolean;
}

export function RentalResultsDisplay({ results, inputs, learnMode }: RentalResultsDisplayProps) {
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
      {/* Key Metrics */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Key Metrics</h3>
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

      {/* Charts */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Visual Analysis</h3>
        <div className="grid gap-4 lg:grid-cols-2">
          <ExpenseBreakdownChart
            mortgage={results.monthlyMortgage}
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
            loanAmount={results.loanAmount}
            purchasePrice={inputs.purchasePrice}
          />
        </div>
      </section>

      {/* Investment Breakdown */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Investment Breakdown</h3>
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
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Income & Expenses</h3>
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
      <section className="animate-fade-in delay-400">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Year 1 Amortization</h3>
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
      <section className="animate-fade-in delay-500">
        <h3 className="mb-4 text-lg font-semibold headline-premium">5-Year Projections</h3>
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
