'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function MetricCardSkeleton({ highlight = false }: { highlight?: boolean }) {
  return (
    <Card className={highlight ? 'border-primary/20 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className={`h-8 ${highlight ? 'w-20' : 'w-28'}`} />
        </div>
      </CardContent>
    </Card>
  );
}

function SectionSkeleton({
  title,
  count,
  highlight = false,
}: {
  title: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <section>
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      <div
        className={`grid gap-4 ${
          count === 2
            ? 'sm:grid-cols-2'
            : count === 3
              ? 'sm:grid-cols-2 lg:grid-cols-3'
              : 'sm:grid-cols-2'
        }`}
      >
        {Array.from({ length: count }).map((_, i) => (
          <MetricCardSkeleton key={i} highlight={highlight && i < 3} />
        ))}
      </div>
    </section>
  );
}

export function RentalResultsSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <SectionSkeleton title="Key Metrics" count={4} highlight />
      <SectionSkeleton title="Investment Breakdown" count={3} />
      <SectionSkeleton title="Income & Expenses" count={5} />
      <SectionSkeleton title="Year 1 Amortization" count={2} />
      <SectionSkeleton title="5-Year Projections" count={2} />
    </div>
  );
}
