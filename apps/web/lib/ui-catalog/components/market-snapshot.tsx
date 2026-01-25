'use client';

import { Building, DollarSign, MapPin, TrendingDown, TrendingUp, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { MarketSnapshotElement } from '../types';

interface MarketSnapshotProps {
  data: Omit<MarketSnapshotElement, 'id' | 'type'>;
  className?: string;
}

export function MarketSnapshot({ data, className }: MarketSnapshotProps) {
  const { county, fmr, demographics, employment, insights } = data;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" />
          {county} County Market Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fmr && fmr.twoBedroom != null && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <DollarSign className="h-3 w-3" />
                2BR FMR
              </div>
              <p className="text-lg font-semibold">${fmr.twoBedroom.toLocaleString()}</p>
              {fmr.suggestedLotRent && (
                <p className="text-xs text-muted-foreground">
                  Lot rent: ${fmr.suggestedLotRent.low ?? 0}-${fmr.suggestedLotRent.high ?? 0}
                </p>
              )}
            </div>
          )}

          {demographics && (
            <>
              {demographics.population != null && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" />
                    Population
                  </div>
                  <p className="text-lg font-semibold">
                    {demographics.population.toLocaleString()}
                  </p>
                </div>
              )}

              {demographics.medianIncome != null && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <DollarSign className="h-3 w-3" />
                    Median Income
                  </div>
                  <p className="text-lg font-semibold">
                    ${demographics.medianIncome.toLocaleString()}
                  </p>
                </div>
              )}

              {demographics.mobileHomesPercent != null && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    MH Housing
                  </div>
                  <p className="text-lg font-semibold">
                    {demographics.mobileHomesPercent.toFixed(1)}%
                  </p>
                </div>
              )}
            </>
          )}

          {employment && employment.unemploymentRate != null && (
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                Unemployment
              </div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-semibold">{employment.unemploymentRate.toFixed(1)}%</p>
                {employment.trend && (
                  <Badge
                    variant={
                      employment.trend === 'improving'
                        ? 'default'
                        : employment.trend === 'declining'
                          ? 'destructive'
                          : 'secondary'
                    }
                    className="text-xs"
                  >
                    {employment.trend === 'improving' && (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {employment.trend === 'declining' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {employment.trend}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Insights */}
        {insights && insights.length > 0 && (
          <div className="pt-2 border-t space-y-1">
            <p className="text-sm font-medium">Key Insights</p>
            {insights.map((insight, idx) => (
              <p key={idx} className="text-sm text-muted-foreground">
                {insight}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
