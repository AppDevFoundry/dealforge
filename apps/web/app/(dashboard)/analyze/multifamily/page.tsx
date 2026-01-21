import { Suspense } from 'react';

import { MultifamilyCalculatorWrapper } from '@/components/calculators/multifamily/multifamily-calculator-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Multi-family Calculator',
  description:
    'Analyze 5-50 unit apartment buildings with NOI, DSCR, cap rate, and commercial metrics',
};

function MultifamilyCalculatorFallback() {
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

export default function MultifamilyCalculatorPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<MultifamilyCalculatorFallback />}>
        <MultifamilyCalculatorWrapper />
      </Suspense>
    </div>
  );
}
