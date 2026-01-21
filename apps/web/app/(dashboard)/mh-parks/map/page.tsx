'use client';

import { ParkMap } from '@/components/mh-parks/map/park-map';

export default function MhParksMapPage() {
  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Park Map</h1>
        <p className="text-muted-foreground">
          Interactive map of manufactured housing communities across Texas
        </p>
      </div>
      <ParkMap />
    </div>
  );
}
