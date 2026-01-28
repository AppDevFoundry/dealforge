'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LeadIntelligence } from '@dealforge/types';
import { AlertTriangle, CheckCircle, MapPin, TrendingUp, XCircle } from 'lucide-react';

interface LeadIntelligencePanelProps {
  intelligence: LeadIntelligence;
  onDownloadReport?: () => void;
}

export function LeadIntelligencePanel({
  intelligence,
  onDownloadReport,
}: LeadIntelligencePanelProps) {
  return (
    <div className="space-y-4">
      {/* Utility Coverage */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="size-4" /> Utility Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className={
                intelligence.hasWaterCcn
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'border-destructive text-destructive'
              }
            >
              {intelligence.hasWaterCcn ? (
                <>
                  <CheckCircle className="mr-1 size-3.5" /> Water:{' '}
                  {intelligence.waterProvider || 'Yes'}
                </>
              ) : (
                <>
                  <XCircle className="mr-1 size-3.5" /> No Water CCN
                </>
              )}
            </Badge>
            <Badge
              variant="outline"
              className={
                intelligence.hasSewerCcn
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-400'
                  : 'border-destructive text-destructive'
              }
            >
              {intelligence.hasSewerCcn ? (
                <>
                  <CheckCircle className="mr-1 size-3.5" /> Sewer:{' '}
                  {intelligence.sewerProvider || 'Yes'}
                </>
              ) : (
                <>
                  <XCircle className="mr-1 size-3.5" /> No Sewer CCN
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Market Data */}
      {(intelligence.fmrTwoBedroom || intelligence.medianHouseholdIncome) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="size-4" /> Market Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {intelligence.fmrTwoBedroom && (
                <div>
                  <p className="text-xs text-muted-foreground">2BR FMR</p>
                  <p className="text-sm font-semibold">
                    ${intelligence.fmrTwoBedroom.toLocaleString()}
                  </p>
                </div>
              )}
              {intelligence.suggestedLotRentLow && intelligence.suggestedLotRentHigh && (
                <div>
                  <p className="text-xs text-muted-foreground">Suggested Lot Rent</p>
                  <p className="text-sm font-semibold">
                    ${intelligence.suggestedLotRentLow.toLocaleString()}–$
                    {intelligence.suggestedLotRentHigh.toLocaleString()}
                  </p>
                </div>
              )}
              {intelligence.medianHouseholdIncome && (
                <div>
                  <p className="text-xs text-muted-foreground">Median Income</p>
                  <p className="text-sm font-semibold">
                    ${intelligence.medianHouseholdIncome.toLocaleString()}
                  </p>
                </div>
              )}
              {intelligence.unemploymentRate !== null &&
                intelligence.unemploymentRate !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">Unemployment</p>
                    <p className="text-sm font-semibold">
                      {intelligence.unemploymentRate.toFixed(1)}%
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Parks */}
      {intelligence.nearbyParksCount > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Nearby Parks ({intelligence.nearbyParksCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(intelligence.nearbyParksData || []).map((park) => (
                <div
                  key={park.id}
                  className="flex items-center justify-between text-sm py-1 border-b border-muted last:border-0"
                >
                  <span className="truncate mr-2">{park.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-muted-foreground">{park.distanceMiles} mi</span>
                    {park.distressScore && (
                      <Badge variant="secondary" className="text-xs">
                        {park.distressScore}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TDHCA Records */}
      {intelligence.recordId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">TDHCA Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Owner</p>
                <p>{intelligence.ownerName || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Manufacturer</p>
                <p>{intelligence.manufacturer || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Model Year</p>
                <p>{intelligence.modelYear || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Liens</p>
                <p
                  className={
                    intelligence.hasLiens
                      ? 'text-destructive font-medium'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }
                >
                  {intelligence.hasLiens
                    ? `$${(intelligence.totalLienAmount || 0).toLocaleString()} active`
                    : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {intelligence.aiRecommendation && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
              {intelligence.aiConfidenceScore !== null &&
                intelligence.aiConfidenceScore !== undefined && (
                  <Badge variant="secondary" className="text-xs">
                    Confidence: {intelligence.aiConfidenceScore}%
                  </Badge>
                )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm font-medium bg-muted/50 rounded-md p-3">
              {intelligence.aiRecommendation}
            </div>

            {intelligence.aiInsights && intelligence.aiInsights.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Insights</p>
                <ul className="space-y-1">
                  {intelligence.aiInsights.map((insight) => (
                    <li key={insight} className="text-sm flex items-start gap-2">
                      <CheckCircle className="size-3.5 mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {intelligence.aiRiskFactors && intelligence.aiRiskFactors.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Risk Factors</p>
                <ul className="space-y-1">
                  {intelligence.aiRiskFactors.map((risk) => (
                    <li key={risk} className="text-sm flex items-start gap-2">
                      <AlertTriangle className="size-3.5 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {intelligence.aiOpportunities && intelligence.aiOpportunities.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Opportunities</p>
                <ul className="space-y-1">
                  {intelligence.aiOpportunities.map((opp) => (
                    <li key={opp} className="text-sm flex items-start gap-2">
                      <TrendingUp className="size-3.5 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span>{opp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Download Report */}
      {onDownloadReport && (
        <div className="pt-2">
          <button
            type="button"
            onClick={onDownloadReport}
            className="w-full text-sm text-primary hover:underline"
          >
            Download Due Diligence Report (PDF)
          </button>
        </div>
      )}
    </div>
  );
}
