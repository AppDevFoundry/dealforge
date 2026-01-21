'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useMhTitlingSummary } from '@/lib/hooks/use-mh-titlings';

import { CountyBreakdown } from './county-breakdown';
import { TitlingChart } from './titling-chart';

export function ActivityDashboard() {
  const { data, isLoading, error } = useMhTitlingSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[350px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <p className="text-muted-foreground">Failed to load market activity data</p>
      </div>
    );
  }

  const summary = data?.data;
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <TitlingChart data={summary.monthlyTotals} />
      <CountyBreakdown data={summary.topCounties} />
    </div>
  );
}
