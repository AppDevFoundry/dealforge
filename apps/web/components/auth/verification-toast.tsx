'use client';

import { toast } from '@/components/ui/sonner';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Client component that shows a success toast when email verification is complete.
 * Checks for ?verified=true in the URL and clears it after showing the toast.
 */
export function VerificationToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const verified = searchParams.get('verified') === 'true';

  useEffect(() => {
    if (verified) {
      toast.success('Email verified!', {
        description: 'Your account is now active. Welcome to DealForge!',
        duration: 5000,
      });

      // Clear the query param from URL without refreshing
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      router.replace(url.pathname, { scroll: false });
    }
  }, [verified, router]);

  return null;
}
