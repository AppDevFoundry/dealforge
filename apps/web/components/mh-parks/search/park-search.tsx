'use client';

import type { MhPropertyType } from '@dealforge/types';
import { useState } from 'react';

import { useMhCommunities } from '@/lib/hooks/use-mh-parks';

import { ParkExportButton } from './park-export-button';
import { ParkSearchFilters } from './park-search-filters';
import { ParkSearchResults } from './park-search-results';

export function ParkSearch() {
  const [county, setCounty] = useState('');
  const [city, setCity] = useState('');
  const [propertyTypes, setPropertyTypes] = useState<MhPropertyType[]>([]);
  const [lotCountMin, setLotCountMin] = useState('');
  const [lotCountMax, setLotCountMax] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filters = {
    ...(county && { county }),
    ...(city && { city }),
    ...(propertyTypes.length === 1 && { propertyType: propertyTypes[0] }),
    ...(lotCountMin && { lotCountMin: Number(lotCountMin) }),
    ...(lotCountMax && { lotCountMax: Number(lotCountMax) }),
    ...(search && { search }),
    page,
    perPage: 50,
  };

  const { data, isLoading } = useMhCommunities(filters);

  const communities = data?.data ?? [];
  const pagination = data?.meta?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const handleReset = () => {
    setCounty('');
    setCity('');
    setPropertyTypes([]);
    setLotCountMin('');
    setLotCountMax('');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside>
        <ParkSearchFilters
          county={county}
          city={city}
          propertyTypes={propertyTypes}
          lotCountMin={lotCountMin}
          lotCountMax={lotCountMax}
          search={search}
          onCountyChange={(v) => {
            setCounty(v);
            setPage(1);
          }}
          onCityChange={(v) => {
            setCity(v);
            setPage(1);
          }}
          onPropertyTypesChange={(v) => {
            setPropertyTypes(v);
            setPage(1);
          }}
          onLotCountMinChange={(v) => {
            setLotCountMin(v);
            setPage(1);
          }}
          onLotCountMaxChange={(v) => {
            setLotCountMax(v);
            setPage(1);
          }}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          onReset={handleReset}
        />
      </aside>

      <main className="space-y-4">
        <div className="flex justify-end">
          <ParkExportButton communities={communities} disabled={isLoading} />
        </div>
        <ParkSearchResults
          communities={communities}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          total={total}
          onPageChange={setPage}
        />
      </main>
    </div>
  );
}
