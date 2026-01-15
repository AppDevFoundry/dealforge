import { Suspense } from 'react';

import { RentalCalculatorWrapper } from '@/components/calculators/rental/rental-calculator-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Rental Property Calculator',
  description: 'Analyze cash flow, ROI, cap rate, and cash-on-cash return for buy-and-hold rentals',
};

function RentalCalculatorFallback() {
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
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export default function RentalCalculatorPage() {
  return (
    <div className="container py-8">
      <Suspense fallback={<RentalCalculatorFallback />}>
        <RentalCalculatorWrapper />
      </Suspense>
    </div>
  );
}
