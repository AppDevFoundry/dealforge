'use client';

import type { SyndicationResults } from '@dealforge/types';

import { RentalResultsCard } from '@/components/calculators/rental/rental-results-card';
import { Card, CardContent } from '@/components/ui/card';
import { SYNDICATION_METRIC_EXPLANATIONS } from '@/lib/constants/syndication-defaults';
import { formatCurrency, formatPercentage } from '@/lib/formatters';

interface SyndicationResultsDisplayProps {
  results: SyndicationResults | null;
  learnMode: boolean;
}

export function SyndicationResultsDisplay({ results, learnMode }: SyndicationResultsDisplayProps) {
  if (!results) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Enter valid inputs to see results</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* LP Returns */}
      <section className="animate-fade-in">
        <h3 className="mb-4 text-lg font-semibold headline-premium">LP Returns</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="LP IRR"
            value={results.lpIrr}
            format="percentage"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.lpIrr}
            learnMode={learnMode}
            highlight
          />
          <EquityMultipleCard
            label="LP Equity Multiple"
            value={results.lpEquityMultiple}
            learnMode={learnMode}
            explanation={SYNDICATION_METRIC_EXPLANATIONS.lpEquityMultiple}
          />
          <RentalResultsCard
            label="LP Total Distributions"
            value={results.lpTotalDistributions}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.lpTotalDistributions}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="LP Equity Invested"
            value={results.lpEquityContribution}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.lpEquityContribution}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* GP Returns */}
      <section className="animate-fade-in delay-100">
        <h3 className="mb-4 text-lg font-semibold headline-premium">GP Returns</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="GP IRR"
            value={results.gpIrr}
            format="percentage"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.gpIrr}
            learnMode={learnMode}
            highlight
          />
          <EquityMultipleCard
            label="GP Equity Multiple"
            value={results.gpEquityMultiple}
            learnMode={learnMode}
            explanation={SYNDICATION_METRIC_EXPLANATIONS.gpEquityMultiple}
          />
          <RentalResultsCard
            label="GP Promote Earned"
            value={results.gpPromote}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.gpPromote}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="GP Equity Invested"
            value={results.gpEquityContribution}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.gpEquityContribution}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Project Summary */}
      <section className="animate-fade-in delay-200">
        <h3 className="mb-4 text-lg font-semibold headline-premium">Project Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <RentalResultsCard
            label="Total Project Profit"
            value={results.totalProjectProfit}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.totalProjectProfit}
            learnMode={learnMode}
            highlight
          />
          <RentalResultsCard
            label="Exit Price"
            value={results.exitPrice}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.exitPrice}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Acquisition Fees"
            value={results.totalAcquisitionFees}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.totalAcquisitionFees}
            learnMode={learnMode}
          />
          <RentalResultsCard
            label="Total Asset Mgmt Fees"
            value={results.totalAssetManagementFees}
            format="currency"
            explanation={SYNDICATION_METRIC_EXPLANATIONS.totalAssetManagementFees}
            learnMode={learnMode}
          />
        </div>
      </section>

      {/* Year-by-Year Waterfall */}
      {results.yearlyData.length > 0 && (
        <section className="animate-fade-in delay-300">
          <h3 className="mb-4 text-lg font-semibold headline-premium">
            Year-by-Year Cash Flow Waterfall
          </h3>
          <Card className="card-premium overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium">Year</th>
                      <th className="px-3 py-2 text-right font-medium">NOI</th>
                      <th className="px-3 py-2 text-right font-medium">LP Dist.</th>
                      <th className="px-3 py-2 text-right font-medium">GP Dist.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.yearlyData.map((row) => (
                      <tr key={row.year} className="border-b last:border-0">
                        <td className="px-3 py-2 font-medium tabular-nums">{row.year}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(row.noi)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-success">
                          {formatCurrency(row.lpDistribution)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(row.gpDistribution)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Sensitivity Analysis */}
      {results.sensitivityData.length > 0 && (
        <section className="animate-fade-in delay-400">
          <h3 className="mb-4 text-lg font-semibold headline-premium">Exit Cap Rate Sensitivity</h3>
          <Card className="card-premium overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium">Cap Rate</th>
                      <th className="px-3 py-2 text-right font-medium">Exit Price</th>
                      <th className="px-3 py-2 text-right font-medium">LP IRR</th>
                      <th className="px-3 py-2 text-right font-medium">LP Multiple</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.sensitivityData.map((row) => (
                      <tr
                        key={row.exitCapRate}
                        className={`border-b last:border-0 ${
                          Math.abs(
                            row.exitCapRate -
                              (results.sensitivityData[
                                Math.floor(results.sensitivityData.length / 2)
                              ]?.exitCapRate ?? 0)
                          ) < 0.01
                            ? 'bg-primary/5 font-medium'
                            : ''
                        }`}
                      >
                        <td className="px-3 py-2 tabular-nums">
                          {formatPercentage(row.exitCapRate)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatCurrency(row.exitPrice)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatPercentage(row.lpIrr)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {row.lpEquityMultiple.toFixed(2)}x
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {learnMode && (
            <p className="mt-2 text-xs text-muted-foreground">
              {SYNDICATION_METRIC_EXPLANATIONS.sensitivityData}
            </p>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * Special card for equity multiple display with colored styling
 */
function EquityMultipleCard({
  label,
  value,
  learnMode,
  explanation,
}: {
  label: string;
  value: number;
  learnMode: boolean;
  explanation?: string;
}) {
  const isGood = value >= 2.0;

  return (
    <Card
      className={`transition-all duration-300 hover-lift ${
        isGood
          ? 'border-success/50 bg-success/5 dark:border-success/40 dark:bg-success/10'
          : 'border-primary/50 bg-primary/5 dark:border-primary/40 dark:bg-primary/10'
      }`}
    >
      <CardContent className="pt-5">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="mt-1">
          <span
            className={`text-2xl font-bold tabular-nums metric-value ${isGood ? 'text-success' : ''}`}
          >
            {value.toFixed(2)}x
          </span>
        </div>
        {isGood && (
          <p className="mt-2 text-xs font-medium text-success">Strong — doubled or more</p>
        )}
        {learnMode && explanation && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{explanation}</p>
        )}
      </CardContent>
    </Card>
  );
}
