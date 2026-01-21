'use client';

import type { MhCommunity } from '@dealforge/types';
import { useState } from 'react';

import { ParkSearch } from '@/components/mh-parks/search';

export default function MhParksSearchPage() {
  const [selectedParkId, setSelectedParkId] = useState<string | null>(null);

  const handleParkSelect = (park: MhCommunity) => {
    setSelectedParkId(park.id);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Parks</h1>
        <p className="text-muted-foreground">
          Search and filter Mobile Home communities by location, size, and characteristics
        </p>
      </div>

      <ParkSearch onParkSelect={handleParkSelect} selectedParkId={selectedParkId} />
    </div>
  );
}
