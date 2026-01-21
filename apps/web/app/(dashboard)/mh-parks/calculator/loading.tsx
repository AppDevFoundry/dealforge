import { Skeleton } from '@/components/ui/skeleton';

export default function MhParksCalculatorLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Form Skeleton */}
        <Skeleton className="h-[600px] rounded-lg" />

        {/* Results Skeleton */}
        <Skeleton className="h-[600px] rounded-lg" />
      </div>
    </div>
  );
}
