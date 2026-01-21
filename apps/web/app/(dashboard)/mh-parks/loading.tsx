import { Skeleton } from '@/components/ui/skeleton';

export default function MhParksLoading() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-96 mt-2" />
      </div>
      <Skeleton className="h-[500px] w-full rounded-lg" />
    </div>
  );
}
