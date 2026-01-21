'use client';

import type { SyndicationInputs, SyndicationResults } from '@dealforge/types';
import { TrendingUp, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IRR_BENCHMARKS,
  SYNDICATION_METRIC_EXPLANATIONS,
} from '@/lib/constants/syndication-defaults';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

import { SyndicationResultsCard } from './syndication-results-card';

interface SyndicationResultsDisplayProps {
  results: SyndicationResults | null;
  inputs: SyndicationInputs | null;
  learnMode: boolean;
}

function getIrrStatus(irr: number): 'excellent' | 'good' | 'acceptable' | 'poor' {
  if (irr >= IRR_BENCHMARKS.excellent) return 'excellent';
  if (irr >= IRR_BENCHMARKS.good) return 'good';
  if (irr >= IRR_BENCHMARKS.acceptable) return 'acceptable';
  return 'poor';
}

function getIrrColor(status: string): string {
  switch (status) {
    case 'excellent':
      return 'text-success';
    case 'good':
      return 'text-success/80';
    case 'acceptable':
      return 'text-warning';
    default:
      return 'text-destructive';
  }
}

export function SyndicationResultsDisplay({
  results,
  inputs,
  learnMode,
}: SyndicationResultsDisplayProps) {
  if (!results || !inputs) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  const lpIrrStatus = getIrrStatus(results.lpIrr);
  const lpIrrColor = getIrrColor(lpIrrStatus);
  const gpIrrStatus = getIrrStatus(results.gpIrr);
  const gpIrrColor = getIrrColor(gpIrrStatus);

  return (
    <div className="space-y-8">
      {/* LP vs GP Returns Highlight */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Investor Returns</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* LP Card */}
          <Card className="relative overflow-hidden border-blue-500/50 bg-blue-500/5 dark:border-blue-400/50 dark:bg-blue-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="size-4 text-blue-500" />
                Limited Partner (LP) Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">IRR</div>
                  <div className={`text-2xl font-bold tabular-nums ${lpIrrColor}`}>
                    {formatPercentage(results.lpIrr)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Equity Multiple</div>
                  <div className="text-2xl font-bold tabular-nums">
                    {results.lpEquityMultiple.toFixed(2)}x
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Equity Invested</span>
                  <span className="font-medium">{formatCurrency(results.lpEquity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Distributions</span>
                  <span className="font-medium text-success">
                    {formatCurrency(results.lpTotalDistributions)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GP Card */}
          <Card className="relative overflow-hidden border-amber-500/50 bg-amber-500/5 dark:border-amber-400/50 dark:bg-amber-500/10">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="size-4 text-amber-500" />
                General Partner (GP) Returns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">IRR</div>
                  <div className={`text-2xl font-bold tabular-nums ${gpIrrColor}`}>
                    {formatPercentage(results.gpIrr)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Equity Multiple</div>
                  <div className="text-2xl font-bold tabular-nums">
                    {results.gpEquityMultiple.toFixed(2)}x
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Equity Invested</span>
                  <span className="font-medium">{formatCurrency(results.gpEquity)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Distributions</span>
                  <span className="font-medium text-success">
                    {formatCurrency(results.gpTotalDistributions)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Promote Earned</span>
                  <span className="font-medium text-amber-500">
                    {formatCurrency(results.gpPromote)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Capitalization Summary */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Capitalization Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SyndicationResultsCard
            label="Total Capitalization"
            value={results.totalCapitalization}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.totalCapitalization}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="Total Equity"
            value={results.totalEquity}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.totalEquity}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="Loan Amount"
            value={results.loanAmount}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.loanAmount}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="Going-In Cap Rate"
            value={results.goingInCapRate}
            format="percentage"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.goingInCapRate}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Fee Summary */}
      <section className="animate-fade-in delay-150">
        <h3 className="mb-4 text-lg font-semibold headline-premium">GP Fee Summary</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <SyndicationResultsCard
            label="Acquisition Fee"
            value={results.acquisitionFee}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.acquisitionFee}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="Total Asset Mgmt Fees"
            value={results.totalAssetManagementFees}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.totalAssetManagementFees}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="GP Promote"
            value={results.gpPromote}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.gpPromote}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>

      {/* Exit Analysis */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Exit Analysis</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SyndicationResultsCard
            label="Exit Value"
            value={results.exitValue}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.exitValue}
            learnMode={learnMode}
            highlight
          />
          <SyndicationResultsCard
            label="Disposition Costs"
            value={results.dispositionCosts}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.dispositionCosts}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="Loan Payoff"
            value={results.loanPayoff}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.loanPayoff}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="Net Sale Proceeds"
            value={results.netSaleProceeds}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.netSaleProceeds}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* LP Distribution Breakdown */}
      <section className="animate-fade-in delay-250">
        <h3 className="mb-4 text-lg font-semibold headline-premium">LP Distribution Breakdown</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SyndicationResultsCard
            label="LP Cash Flow Distributions"
            value={results.lpCashFlowDistributions}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.lpCashFlowDistributions}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="LP Sale Proceeds"
            value={results.lpSaleProceedsDistribution}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.lpSaleProceedsDistribution}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="LP Preferred Return (Total)"
            value={results.lpPreferredReturnTotal}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.lpPreferredReturnTotal}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="LP Total Distributions"
            value={results.lpTotalDistributions}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.lpTotalDistributions}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>

      {/* Year-by-Year Cash Flow */}
      <section className="animate-fade-in delay-300">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Year-by-Year Cash Flow</h3>
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Year</TableHead>
                  <TableHead className="text-right">NOI</TableHead>
                  <TableHead className="text-right">Debt Service</TableHead>
                  <TableHead className="text-right">Cash Flow</TableHead>
                  <TableHead className="text-right">LP Dist.</TableHead>
                  <TableHead className="text-right">GP Dist.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.yearlyProjections.map((year) => (
                  <TableRow key={year.year}>
                    <TableCell className="text-center font-medium">{year.year}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(year.noi)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(year.debtService)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${year.cashFlowAfterDebt >= 0 ? 'text-success' : 'text-destructive'}`}
                    >
                      {formatCurrency(year.cashFlowAfterDebt)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-blue-600 dark:text-blue-400">
                      {formatCurrency(year.lpDistribution)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">
                      {formatCurrency(year.gpDistribution)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Sensitivity Analysis */}
      <section className="animate-fade-in delay-350">
        <h3 className="mb-4 text-lg font-semibold headline-premium">
          Exit Cap Rate Sensitivity Analysis
        </h3>
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center">Exit Cap Rate</TableHead>
                  <TableHead className="text-right">Exit Value</TableHead>
                  <TableHead className="text-right">LP IRR</TableHead>
                  <TableHead className="text-right">LP Multiple</TableHead>
                  <TableHead className="text-right">GP IRR</TableHead>
                  <TableHead className="text-right">GP Multiple</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.sensitivityAnalysis.map((scenario) => (
                  <TableRow
                    key={scenario.exitCapRate}
                    className={scenario.exitCapRate === inputs.exitCapRate ? 'bg-primary/5' : ''}
                  >
                    <TableCell className="text-center font-medium">
                      {formatPercentage(scenario.exitCapRate)}
                      {scenario.exitCapRate === inputs.exitCapRate && (
                        <span className="ml-2 text-xs text-muted-foreground">(Base)</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(scenario.exitValue)}
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${getIrrColor(getIrrStatus(scenario.lpIrr))}`}
                    >
                      {formatPercentage(scenario.lpIrr)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {scenario.lpEquityMultiple.toFixed(2)}x
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${getIrrColor(getIrrStatus(scenario.gpIrr))}`}
                    >
                      {formatPercentage(scenario.gpIrr)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {scenario.gpEquityMultiple.toFixed(2)}x
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="mt-4 text-xs text-muted-foreground">
              Higher exit cap rates result in lower sale prices and reduced returns. Use this table
              to stress-test your assumptions.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Deal Metrics */}
      <section className="animate-fade-in delay-400">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Deal Metrics</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <SyndicationResultsCard
            label="Total NOI Over Hold"
            value={results.totalNoiOverHold}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.totalNoiOverHold}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="Average Cash on Cash"
            value={results.averageCashOnCash}
            format="percentage"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.averageCashOnCash}
            learnMode={learnMode}
          />
          <SyndicationResultsCard
            label="Total Profit"
            value={results.totalProfitOverHold}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.totalProfitOverHold}
            learnMode={learnMode}
            highlight
          />
        </div>
      </section>
    </div>
  );
}
