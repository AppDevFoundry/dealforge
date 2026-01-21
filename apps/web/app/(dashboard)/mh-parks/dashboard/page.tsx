'use client';

import {
  ActivitySummaryCards,
  CountyComparisonTable,
  TitlingTrendsChart,
} from '@/components/mh-parks/dashboard';
import { useMhParkStats, useMhParks, useTitlingActivity } from '@/lib/hooks/use-mh-parks';

export default function MhParksDashboardPage() {
  const { data: stats, isLoading: isLoadingStats } = useMhParkStats();
  const { data: parksResponse, isLoading: isLoadingParks } = useMhParks({ perPage: 1000 });
  const { data: titlings, isLoading: isLoadingTitlings } = useTitlingActivity({});

  const parks = parksResponse?.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Market Activity Dashboard</h1>
        <p className="text-muted-foreground">
          Monthly titling activity and market trends for Texas MH communities
        </p>
      </div>

      {/* Summary Cards */}
      <ActivitySummaryCards stats={stats} isLoading={isLoadingStats} />

      {/* Charts and Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TitlingTrendsChart titlings={titlings ?? []} isLoading={isLoadingTitlings} />
        <CountyComparisonTable
          parks={parks}
          titlings={titlings ?? []}
          isLoading={isLoadingParks || isLoadingTitlings}
        />
      </div>
    </div>
  );
}
