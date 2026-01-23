'use client';

import { useState } from 'react';

import {
  TaxLienStatsCards,
  TaxLiensByCountyChart,
  TaxLiensTable,
} from '@/components/mh-parks/tax-liens';
import { useTaxLienStats, useTaxLiens } from '@/lib/hooks/use-tax-liens';

// MVP counties for Texas
const COUNTIES = ['Bexar', 'Hidalgo', 'Cameron', 'Nueces', 'Travis'];

export default function TaxLiensPage() {
  const [selectedCounty, setSelectedCounty] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'released' | undefined>(
    undefined
  );

  const { data: stats, isLoading: isLoadingStats } = useTaxLienStats(selectedCounty);
  const { data: liensResponse, isLoading: isLoadingLiens } = useTaxLiens({
    county: selectedCounty,
    status: selectedStatus,
    perPage: 100,
  });

  const liens = liensResponse?.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tax Lien Tracker</h1>
        <p className="text-muted-foreground">Distress signals for manufactured homes in Texas</p>
      </div>

      {/* Summary Cards */}
      <TaxLienStatsCards stats={stats} isLoading={isLoadingStats} />

      {/* Chart and Table */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TaxLiensByCountyChart stats={stats} isLoading={isLoadingStats} />
        <TaxLiensTable
          liens={liens}
          isLoading={isLoadingLiens}
          counties={COUNTIES}
          selectedCounty={selectedCounty}
          onCountyChange={setSelectedCounty}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </div>
    </div>
  );
}
