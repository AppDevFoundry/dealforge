import { Skeleton } from '@/components/ui/skeleton';

export default function ParkDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header skeleton */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Info grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>

      {/* Lien summary skeleton */}
      <Skeleton className="h-[200px] rounded-lg" />

      {/* Title activity table skeleton */}
      <Skeleton className="h-[300px] rounded-lg" />
    </div>
  );
}
