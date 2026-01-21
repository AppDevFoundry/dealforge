'use client';

import type { Deal, SyndicationInputs } from '@dealforge/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useDeal } from '@/lib/hooks/use-deals';

import { SyndicationCalculator } from './syndication-calculator';

export function SyndicationCalculatorWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get('dealId');

  const { data: dealResponse, isLoading, error } = useDeal(dealId ?? undefined);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Handle beforeunload warning for unsaved changes
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
        router.replace(`/analyze/syndication?dealId=${savedDealId}`, { scroll: false });
      }
    },
    [dealId, router]
  );

  // Loading state
  if (dealId && isLoading) {
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

  // Error state
  if (dealId && error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-destructive">Failed to load deal. It may have been deleted.</p>
        <button
          type="button"
          onClick={() => router.push('/analyze/syndication')}
          className="text-primary underline"
        >
          Start a new analysis
        </button>
      </div>
    );
  }

  // Validate deal type if loaded
  const deal = dealResponse?.data;
  if (deal && deal.type !== 'syndication') {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-destructive">This deal is not a Syndication analysis.</p>
        <button
          type="button"
          onClick={() => router.push('/analyze/syndication')}
          className="text-primary underline"
        >
          Start a new Syndication analysis
        </button>
      </div>
    );
  }

  return (
    <SyndicationCalculator
      dealId={dealId ?? undefined}
      initialDeal={deal as Deal & { inputs: SyndicationInputs }}
      onDealSaved={handleDealSaved}
    />
  );
}
