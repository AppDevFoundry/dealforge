import { Suspense } from 'react';

import { BRRRRCalculatorWrapper } from '@/components/calculators/brrrr/brrrr-calculator-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'BRRRR Calculator',
  description:
    'Buy-Rehab-Rent-Refinance-Repeat analysis with refinance projections and cash recovery metrics',
};

function BRRRRCalculatorFallback() {
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
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function BRRRRCalculatorPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<BRRRRCalculatorFallback />}>
        <BRRRRCalculatorWrapper />
      </Suspense>
    </div>
  );
}
