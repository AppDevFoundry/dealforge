'use client';

import type { DistressedParksQuery } from '@dealforge/types';
import { useState } from 'react';

import { DistressedParksFilters } from '@/components/mh-parks/distressed/distressed-parks-filters';
import { DistressedParksTable } from '@/components/mh-parks/distressed/distressed-parks-table';
import { useDistressedParks } from '@/lib/hooks/use-mh-parks';

export default function DistressedParksPage() {
  const [filters, setFilters] = useState<Partial<DistressedParksQuery>>({
    minScore: 20,
    sortBy: 'score',
    limit: 25,
  });

  const { data: parks, isLoading } = useDistressedParks(filters);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Distressed Parks</h1>
        <p className="text-muted-foreground">MH communities ranked by tax lien distress signals</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <DistressedParksFilters filters={filters} onFiltersChange={setFilters} />
        <DistressedParksTable parks={parks ?? []} isLoading={isLoading} />
      </div>
    </div>
  );
}
