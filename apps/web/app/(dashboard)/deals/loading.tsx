import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function DealCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DealsLoading() {
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      {/* Filter skeletons */}
      <div className="mt-6 flex gap-4">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-16" />
      </div>

      {/* Deal cards skeletons */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <DealCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
