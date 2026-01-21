import { Suspense } from 'react';

import { MhParkCalculatorWrapper } from '@/components/calculators/mh-park/mh-park-calculator-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'MH Park Calculator | DealForge',
  description: 'Analyze manufactured housing park investments with lot rent analysis',
};

function CalculatorSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export default function MhParkCalculatorPage() {
  return (
    <div className="container max-w-7xl py-6">
      <Suspense fallback={<CalculatorSkeleton />}>
        <MhParkCalculatorWrapper />
      </Suspense>
    </div>
  );
}
