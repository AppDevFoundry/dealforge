'use client';

import { ParkSearch } from '@/components/mh-parks/search/park-search';

export default function MhParksSearchPage() {
  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Park Search</h1>
        <p className="text-muted-foreground">
          Search and filter manufactured housing communities across Texas
        </p>
      </div>
      <ParkSearch />
    </div>
  );
}
