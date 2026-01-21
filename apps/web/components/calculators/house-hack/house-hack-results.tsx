'use client';

import type { HouseHackInputs, HouseHackResults } from '@dealforge/types';

import { RentalResultsCard } from '@/components/calculators/rental/rental-results-card';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { HOUSE_HACK_METRIC_EXPLANATIONS } from '@/lib/constants/house-hack-defaults';
import { formatCurrency } from '@/lib/formatters';

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

  const livesForFree = results.netHousingCost <= 0;

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Housing Cost Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <HousingCostCard
            netHousingCost={results.netHousingCost}
            livesForFree={livesForFree}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Savings vs Renting"
            value={results.savingsVsRenting}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.savingsVsRenting}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Break-Even Rent Needed"
            value={results.breakEvenRent}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.breakEvenRent}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Total Monthly Rent"
            value={results.totalMonthlyRent}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.totalMonthlyRent}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Move-Out Scenario */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">
          If You Move Out (All Rented)
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Monthly Cash Flow"
            value={results.cashFlowAllRented}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.cashFlowAllRented}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Cash-on-Cash Return"
            value={results.cashOnCashReturn}
            format="percentage"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.cashOnCashReturn}
            learnMode={learnMode}
            highlight
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
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.totalInvestment}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Loan Amount"
            value={results.loanAmount}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.loanAmount}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Monthly Mortgage"
            value={results.monthlyMortgage}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.monthlyMortgage}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Monthly Operating Expenses"
            value={results.totalMonthlyExpenses}
            format="currency"
            explanation={HOUSE_HACK_METRIC_EXPLANATIONS.totalMonthlyExpenses}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Summary Comparison */}
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Monthly Comparison</h3>
        <Card className="card-premium">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <ComparisonRow label="Renting elsewhere" value={inputs.ownerEquivalentRent} muted />
              <ComparisonRow
                label="Your effective housing cost"
                value={results.effectiveHousingCost}
                highlight={livesForFree}
              />
              <div className="border-t pt-3">
                <ComparisonRow
                  label="Monthly savings"
                  value={results.savingsVsRenting}
                  bold
                  highlight={results.savingsVsRenting > 0}
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
 * Special card for net housing cost with green styling when living for free
 */
function HousingCostCard({
  netHousingCost,
  livesForFree,
  learnMode,
}: {
  netHousingCost: number;
  livesForFree: boolean;
  learnMode: boolean;
}) {
  return (
    <Card
      className={`
        transition-all duration-300 hover-lift group relative overflow-hidden
        ${
          livesForFree
            ? 'border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10'
            : 'border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
        }
      `}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${livesForFree ? 'from-success/5' : 'from-primary/5'} via-transparent ${livesForFree ? 'to-success/5' : 'to-primary/5'} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <CardHeader className="pb-2 relative">
        <div className="text-sm font-medium text-muted-foreground">Effective Housing Cost</div>
      </CardHeader>
      <CardContent className="relative">
        <span
          className={`text-2xl font-bold tabular-nums metric-value ${livesForFree ? 'text-success' : ''}`}
        >
          {formatCurrency(netHousingCost)}
        </span>
        {livesForFree && (
          <p className="mt-2 text-xs font-medium text-success">
            You live for free — tenants cover everything!
          </p>
        )}
        {learnMode && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {HOUSE_HACK_METRIC_EXPLANATIONS.netHousingCost}
          </p>
        )}
      </CardContent>
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent ${livesForFree ? 'via-success' : 'via-primary'} to-transparent opacity-50`}
      />
    </Card>
  );
}

/**
 * Simple comparison row for the summary section
 */
function ComparisonRow({
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
