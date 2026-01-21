import { Suspense } from 'react';

import { HouseHackCalculatorWrapper } from '@/components/calculators/house-hack/house-hack-calculator-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'House Hack Calculator',
  description:
    'Owner-occupied multi-unit analysis with living cost offsets and move-out projections',
};

function HouseHackCalculatorFallback() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function HouseHackCalculatorPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<HouseHackCalculatorFallback />}>
        <HouseHackCalculatorWrapper />
      </Suspense>
    </div>
  );
}
