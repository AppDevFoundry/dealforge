'use client';

import { useState } from 'react';

import {
  TaxLienStatsCards,
  TaxLiensByCountyChart,
  TaxLiensTable,
  TaxLiensTrendChart,
} from '@/components/mh-parks/tax-liens';
import { useTaxLienStats, useTaxLiens } from '@/lib/hooks/use-tax-liens';

// MVP counties for Texas
const COUNTIES = ['Bexar', 'Hidalgo', 'Cameron', 'Nueces', 'Travis'];

// Available tax years
const YEARS = [2024, 2023, 2022];

export default function TaxLiensPage() {
  const [selectedCounty, setSelectedCounty] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<'active' | 'released' | undefined>(
    undefined
  );
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const { data: stats, isLoading: isLoadingStats } = useTaxLienStats(selectedCounty);
  const { data: liensResponse, isLoading: isLoadingLiens } = useTaxLiens({
    county: selectedCounty,
    status: selectedStatus,
    year: selectedYear,
    perPage: 500,
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

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TaxLiensByCountyChart stats={stats} isLoading={isLoadingStats} />
        <TaxLiensTrendChart liens={liens} isLoading={isLoadingLiens} />
      </div>

      {/* Table - Full Width */}
      <TaxLiensTable
        liens={liens}
        isLoading={isLoadingLiens}
        counties={COUNTIES}
        years={YEARS}
        selectedCounty={selectedCounty}
        onCountyChange={setSelectedCounty}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
    </div>
  );
}
