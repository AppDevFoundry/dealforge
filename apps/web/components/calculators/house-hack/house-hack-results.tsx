'use client';

import type { HouseHackInputs, HouseHackResults } from '@dealforge/types';
import { Home, PiggyBank } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { HOUSE_HACK_METRIC_EXPLANATIONS } from '@/lib/constants/house-hack-defaults';
import { formatCurrency } from '@/lib/formatters';

import { HouseHackResultsCard, LiveForFreeCard, RentCoverageCard } from './house-hack-results-card';

interface HouseHackResultsDisplayProps {
  results: HouseHackResults | null;
  inputs: HouseHackInputs | null;
  learnMode: boolean;
}

export function HouseHackResultsDisplay({
  results,
  inputs,
  learnMode,
}: HouseHackResultsDisplayProps) {
  if (!results || !inputs) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* House Hack Highlight - The Key Numbers */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Your Housing Cost</h3>
        <Card
          className={`relative overflow-hidden ${
            results.livesForFree
              ? 'border-success bg-success/5 dark:border-success/50 dark:bg-success/10'
              : 'border-primary bg-primary/5 dark:border-primary/50 dark:bg-primary/10'
          }`}
        >
          {results.livesForFree && (
            <div className="absolute inset-0 bg-gradient-to-br from-success/10 via-transparent to-success/10" />
          )}
          <CardContent className="pt-6 relative">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Net Housing Cost - Primary Metric */}
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  {results.livesForFree ? 'Monthly Cash Flow' : 'Net Monthly Housing Cost'}
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-4xl font-bold tabular-nums ${
                      results.livesForFree ? 'text-success' : 'text-foreground'
                    }`}
                  >
                    {results.livesForFree
                      ? `+${formatCurrency(Math.abs(results.netHousingCost))}`
                      : formatCurrency(results.netHousingCost)}
                  </span>
                  {results.livesForFree ? (
                    <div className="flex items-center gap-1 rounded-full bg-success/20 px-3 py-1">
                      <Home className="size-4 text-success" />
                      <span className="text-sm font-semibold text-success">Live Free!</span>
                    </div>
                  ) : (
                    <Home className="size-8 text-primary" />
                  )}
                </div>
                {learnMode && (
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {HOUSE_HACK_METRIC_EXPLANATIONS.netHousingCost}
                  </p>
                )}
              </div>

              {/* Savings vs Renting */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Monthly Savings
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xl font-bold tabular-nums ${
                      results.savingsVsRenting > 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {formatCurrency(results.savingsVsRenting)}
                  </span>
                  {results.savingsVsRenting > 0 && <PiggyBank className="size-5 text-success" />}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  vs {formatCurrency(inputs.equivalentRent)}/mo rent
                </div>
              </div>

              {/* Annual Savings */}
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Annual Savings</div>
                <div className="text-2xl font-bold tabular-nums text-primary">
                  {formatCurrency(results.savingsVsRenting * 12)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">per year in your pocket</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* House Hack Status & Coverage */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">House Hack Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <LiveForFreeCard
            netHousingCost={results.netHousingCost}
            savingsVsRenting={results.savingsVsRenting}
            livesForFree={results.livesForFree}
            learnMode={learnMode}
          />
          <RentCoverageCard
            rentCoverageRatio={results.rentCoverageRatio}
            effectiveRentalIncome={results.effectiveRentalIncome}
            grossMonthlyCost={results.grossMonthlyCost}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Investment Metrics (If All Units Rented) */}
      <section className="animate-fade-in delay-150">
        <h3 className="mb-4 text-lg font-semibold headline-premium">
          Investment Potential (If You Move Out)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HouseHackResultsCard
            label="Monthly Cash Flow"
            value={results.cashFlowIfRented}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.cashFlowIfRented}
            learnMode={learnMode}
          />
          <HouseHackResultsCard
            label="Annual Cash Flow"
            value={results.annualCashFlowIfRented}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.annualCashFlowIfRented}
            learnMode={learnMode}
          />
          <HouseHackResultsCard
            label="Cash on Cash Return"
            value={results.cashOnCashIfRented}
            format="percentage"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.cashOnCashIfRented}
            learnMode={learnMode}
            highlight
            status={
              results.cashOnCashIfRented >= 8
                ? 'positive'
                : results.cashOnCashIfRented >= 4
                  ? 'warning'
                  : 'negative'
            }
          />
          <HouseHackResultsCard
            label="Cap Rate"
            value={results.capRate}
            format="percentage"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.capRate}
            learnMode={learnMode}
            status="neutral"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          These metrics show the property's performance if you moved out and rented all units.
        </p>
      </section>

      {/* Income Analysis */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Income Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HouseHackResultsCard
            label="Gross Potential Rent"
            value={results.grossPotentialRent}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.grossPotentialRent}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Rental Income (Tenants)"
            value={results.rentalIncomeMonthly}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.rentalIncomeMonthly}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Effective Rental Income"
            value={results.effectiveRentalIncome}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.effectiveRentalIncome}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Your Unit's Potential"
            value={results.ownerUnitPotentialRent}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.ownerUnitPotentialRent}
            learnMode={learnMode}
            status="neutral"
          />
        </div>
      </section>

      {/* Financing Summary */}
      <section className="animate-fade-in delay-250">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Financing Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <HouseHackResultsCard
            label="Loan Amount"
            value={results.loanAmount}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.loanAmount}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Monthly Mortgage (P&I)"
            value={results.monthlyMortgage}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.monthlyMortgage}
            learnMode={learnMode}
            status="neutral"
          />
          {results.monthlyPmi > 0 && (
            <HouseHackResultsCard
              label="Monthly PMI"
              value={results.monthlyPmi}
              format="currency"
              explanation={HOUSE_HACK_METRIC_EXPLANATIONS.monthlyPmi}
              learnMode={learnMode}
              status="neutral"
            />
          )}
          <HouseHackResultsCard
            label="Total Debt Service"
            value={results.totalMonthlyDebtService}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.totalMonthlyDebtService}
            learnMode={learnMode}
            status="neutral"
          />
        </div>
      </section>

      {/* Expense Breakdown */}
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Monthly Expenses</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HouseHackResultsCard
            label="Property Tax"
            value={results.monthlyPropertyTax}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.monthlyPropertyTax}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Insurance"
            value={results.monthlyInsurance}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.monthlyInsurance}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Maintenance Reserve"
            value={results.monthlyMaintenance}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.monthlyMaintenance}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="CapEx Reserve"
            value={results.monthlyCapex}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.monthlyCapex}
            learnMode={learnMode}
            status="neutral"
          />
          {results.monthlyManagement > 0 && (
            <HouseHackResultsCard
              label="Property Management"
              value={results.monthlyManagement}
              format="currency"
              explanation={HOUSE_HACK_METRIC_EXPLANATIONS.monthlyManagement}
              learnMode={learnMode}
              status="neutral"
            />
          )}
          <HouseHackResultsCard
            label="Total Expenses"
            value={results.totalMonthlyExpenses}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.totalMonthlyExpenses}
            learnMode={learnMode}
            highlight
            status="neutral"
          />
        </div>
      </section>

      {/* Total Investment */}
      <section className="animate-fade-in delay-350">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Total Investment</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <HouseHackResultsCard
            label="Down Payment"
            value={results.downPayment}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.downPayment}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Closing Costs"
            value={inputs.closingCosts}
            format="currency"
            explanation="Costs associated with purchasing the property, including lender fees, title insurance, and escrow."
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Total Cash Required"
            value={results.totalInvestment}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.totalInvestment}
            learnMode={learnMode}
            highlight
            status="neutral"
          />
        </div>
      </section>

      {/* Break-Even Analysis */}
      <section className="animate-fade-in delay-400">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Break-Even Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <HouseHackResultsCard
            label="Break-Even Rent Needed"
            value={results.breakEvenRent}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.breakEvenRent}
            learnMode={learnMode}
            status="neutral"
          />
          <HouseHackResultsCard
            label="Net Operating Income"
            value={results.netOperatingIncome}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.netOperatingIncome}
            learnMode={learnMode}
          />
        </div>
      </section>
    </div>
  );
}
