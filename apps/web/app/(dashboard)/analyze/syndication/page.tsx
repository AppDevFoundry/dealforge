import { Suspense } from 'react';

import { SyndicationCalculatorWrapper } from '@/components/calculators/syndication/syndication-calculator-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Syndication Calculator',
  description:
    'LP/GP waterfall distributions with IRR hurdles, equity multiples, and sensitivity analysis',
};

function SyndicationCalculatorFallback() {
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

export default function SyndicationCalculatorPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<SyndicationCalculatorFallback />}>
        <SyndicationCalculatorWrapper />
      </Suspense>
    </div>
  );
}
