import { Skeleton } from '@/components/ui/skeleton';

export default function DistressedParksLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Filters Sidebar Skeleton */}
        <div className="space-y-6">
          <Skeleton className="h-[350px] rounded-lg" />
          <Skeleton className="h-[150px] rounded-lg" />
        </div>

        {/* Results Table Skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-[500px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
