'use client';

import { AlertTriangle, CheckCircle, TrendingUp, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

import type { DealSummaryElement } from '../types';

const recommendationConfig = {
  'strong-buy': {
    label: 'Strong Buy',
    variant: 'default' as const,
    icon: TrendingUp,
    className: 'bg-green-600',
  },
  buy: {
    label: 'Buy',
    variant: 'default' as const,
    icon: CheckCircle,
    className: 'bg-green-500',
  },
  hold: {
    label: 'Hold',
    variant: 'secondary' as const,
    icon: AlertTriangle,
    className: '',
  },
  avoid: {
    label: 'Avoid',
    variant: 'destructive' as const,
    icon: XCircle,
    className: '',
  },
};

interface DealSummaryProps {
  data: Omit<DealSummaryElement, 'id' | 'type'>;
  className?: string;
}

export function DealSummary({ data, className }: DealSummaryProps) {
  const { parkName, metrics, recommendation, highlights, concerns } = data;

  // Handle missing recommendation gracefully
  const recConfig = recommendation ? recommendationConfig[recommendation] : null;
  const RecIcon = recConfig?.icon;

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{parkName || 'Deal'} - Deal Analysis</CardTitle>
          {recConfig && RecIcon && (
            <Badge variant={recConfig.variant} className={cn('gap-1', recConfig.className)}>
              <RecIcon className="h-3 w-3" />
              {recConfig.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {metrics.capRate != null && (
              <div>
                <p className="text-sm text-muted-foreground">Cap Rate</p>
                <p className="text-lg font-semibold">{metrics.capRate.toFixed(1)}%</p>
              </div>
            )}
            {metrics.cashOnCash != null && (
              <div>
                <p className="text-sm text-muted-foreground">Cash-on-Cash</p>
                <p className="text-lg font-semibold">{metrics.cashOnCash.toFixed(1)}%</p>
              </div>
            )}
            {metrics.dscr != null && (
              <div>
                <p className="text-sm text-muted-foreground">DSCR</p>
                <p className="text-lg font-semibold">{metrics.dscr.toFixed(2)}x</p>
              </div>
            )}
            {metrics.noi != null && (
              <div>
                <p className="text-sm text-muted-foreground">NOI</p>
                <p className="text-lg font-semibold">${metrics.noi.toLocaleString()}</p>
              </div>
            )}
            {metrics.pricePerLot != null && (
              <div>
                <p className="text-sm text-muted-foreground">Price/Lot</p>
                <p className="text-lg font-semibold">${metrics.pricePerLot.toLocaleString()}</p>
              </div>
            )}
          </div>
        )}

        {/* Highlights and Concerns */}
        {((highlights && highlights.length > 0) || (concerns && concerns.length > 0)) && (
          <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
            {highlights && highlights.length > 0 && (
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">Highlights</p>
                <ul className="text-sm space-y-1">
                  {highlights.map((h, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-1 shrink-0" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {concerns && concerns.length > 0 && (
              <div>
                <p className="text-sm font-medium text-amber-600 mb-1">Concerns</p>
                <ul className="text-sm space-y-1">
                  {concerns.map((c, idx) => (
                    <li key={idx} className="flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 text-amber-600 mt-1 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
