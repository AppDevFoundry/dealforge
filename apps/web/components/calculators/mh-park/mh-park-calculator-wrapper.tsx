'use client';

import type { Deal, MhParkInputs } from '@dealforge/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useDeal } from '@/lib/hooks/use-deals';
import { MhParkCalculator } from './mh-park-calculator';

export function MhParkCalculatorWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');

  const { data: dealResponse, isLoading, error } = useDeal(dealId ?? undefined);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleDealSaved = useCallback(
    (savedDealId: string) => {
      setHasUnsavedChanges(false);
      if (!dealId && savedDealId) {
        router.replace(`/mh-parks/calculator?dealId=${savedDealId}`, { scroll: false });
      }
    },
    [dealId, router]
  );

  if (dealId && isLoading) {
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

  if (dealId && error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <p className="text-destructive">Failed to load deal</p>
        <button
          type="button"
          onClick={() => router.push('/mh-parks/calculator')}
          className="text-sm text-muted-foreground underline hover:text-foreground"
        >
          Start new analysis
        </button>
      </div>
    );
  }

  const deal = dealResponse?.data;
  if (deal && deal.type !== 'mh_park') {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">This deal is not an MH Park analysis.</p>
      </div>
    );
  }

  return (
    <MhParkCalculator
      dealId={dealId ?? undefined}
      initialDeal={deal as Deal & { inputs: MhParkInputs }}
      onDealSaved={handleDealSaved}
    />
  );
}
