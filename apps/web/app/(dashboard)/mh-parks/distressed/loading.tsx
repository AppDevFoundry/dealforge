import { Skeleton } from '@/components/ui/skeleton';

export default function DistressedParksLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-[400px] rounded-lg" />
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    </div>
  );
}
