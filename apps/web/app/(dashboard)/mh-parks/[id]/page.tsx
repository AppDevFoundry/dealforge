'use client';

import { useParams } from 'next/navigation';

import { LienSummaryPanel } from '@/components/mh-parks/detail/lien-summary-panel';
import { ParkDetailHeader } from '@/components/mh-parks/detail/park-detail-header';
import { ParkInfoGrid } from '@/components/mh-parks/detail/park-info-grid';
import { TitleActivityTable } from '@/components/mh-parks/detail/title-activity-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useMhPark, useParkTdhcaData } from '@/lib/hooks/use-mh-parks';

export default function ParkDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: parkResponse, isLoading: isParkLoading } = useMhPark(id);
  const { data: tdhcaData, isLoading: isTdhcaLoading } = useParkTdhcaData(id);

  const park = parkResponse?.data;

  if (isParkLoading) {
    return <ParkDetailSkeleton />;
  }

  if (!park) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <h2 className="text-xl font-semibold">Park not found</h2>
        <p className="text-muted-foreground">The park you are looking for does not exist.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <ParkDetailHeader park={park} />
      <ParkInfoGrid park={park} />

      {isTdhcaLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      ) : tdhcaData ? (
        <>
          <LienSummaryPanel lienSummary={tdhcaData.lienSummary} />
          <TitleActivityTable titleActivity={tdhcaData.titleActivity} />
        </>
      ) : (
        <>
          <LienSummaryPanel lienSummary={null} />
          <TitleActivityTable titleActivity={[]} />
        </>
      )}
    </div>
  );
}

function ParkDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-[200px] rounded-lg" />
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );
}
