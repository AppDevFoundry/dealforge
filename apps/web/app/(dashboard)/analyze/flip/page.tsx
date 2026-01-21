import { Suspense } from 'react';

import { FlipCalculatorWrapper } from '@/components/calculators/flip/flip-calculator-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Flip/Rehab Calculator',
  description: 'ARV-based profit projections for fix-and-flip investments with 70% Rule analysis',
};

function FlipCalculatorFallback() {
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

export default function FlipCalculatorPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<FlipCalculatorFallback />}>
        <FlipCalculatorWrapper />
      </Suspense>
    </div>
  );
}
