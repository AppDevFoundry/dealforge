'use client';

import type { TaxLienSummary } from '@dealforge/types';
import { AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LienSummaryPanelProps {
  lienSummary: TaxLienSummary | null;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function LienSummaryPanel({ lienSummary }: LienSummaryPanelProps) {
  if (!lienSummary || lienSummary.totalLiens === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tax Lien Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No lien data available for this community.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Tax Lien Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Active Liens</p>
            <p className="text-2xl font-bold text-amber-600">{lienSummary.activeLiens}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Released Liens</p>
            <p className="text-2xl font-bold">{lienSummary.releasedLiens}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Tax Owed</p>
            <p className="text-lg font-semibold">{formatCurrency(lienSummary.totalTaxAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Tax Amount</p>
            <p className="text-lg font-semibold">{formatCurrency(lienSummary.avgTaxAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Most Recent Lien</p>
            <p className="text-lg font-semibold">{formatDate(lienSummary.mostRecentLienDate)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tax Years</p>
            <p className="text-sm font-medium">
              {lienSummary.taxYearsSpanned.length > 0
                ? lienSummary.taxYearsSpanned.join(', ')
                : 'N/A'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
