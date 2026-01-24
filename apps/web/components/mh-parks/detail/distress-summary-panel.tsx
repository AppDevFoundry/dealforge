'use client';

import type { DistressFactors } from '@dealforge/types';
import { ShieldAlert } from 'lucide-react';

import { DistressScoreBadge } from '@/components/mh-parks/distressed/distress-score-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DistressSummaryPanelProps {
  distressScore: number | null;
  distressFactors: DistressFactors | null;
  distressUpdatedAt: Date | null;
}

function FactorRow({
  label,
  value,
  description,
}: { label: string; value: number; description: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <span className="text-sm font-medium">{Math.round(value)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

export function DistressSummaryPanel({
  distressScore,
  distressFactors,
  distressUpdatedAt,
}: DistressSummaryPanelProps) {
  if (distressScore == null || distressScore === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-500" />
            Distress Assessment
          </span>
          <DistressScoreBadge score={distressScore} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {distressFactors ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <FactorRow
              label="Lien Ratio"
              value={distressFactors.lienRatio}
              description={`${distressFactors.activeLienCount} active liens vs lot count`}
            />
            <FactorRow
              label="Tax Burden"
              value={distressFactors.taxBurden}
              description={`$${Math.round(distressFactors.totalTaxOwed).toLocaleString()} total owed`}
            />
            <FactorRow
              label="Recency"
              value={distressFactors.recency}
              description="How recent the most recent lien is"
            />
            <FactorRow
              label="Persistence"
              value={distressFactors.persistence}
              description={`${distressFactors.taxYearsWithLiens} tax year${distressFactors.taxYearsWithLiens !== 1 ? 's' : ''} with liens`}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Factor breakdown unavailable.</p>
        )}
        {distressUpdatedAt && (
          <p className="mt-4 text-xs text-muted-foreground">
            Last calculated{' '}
            {new Date(distressUpdatedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
