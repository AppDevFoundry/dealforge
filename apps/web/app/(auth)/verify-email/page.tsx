import Link from 'next/link';
import { Suspense } from 'react';

import { VerifyEmailContent } from './verify-email-content';

export const metadata = {
  title: 'Verify Email',
  description: 'Verify your DealForge email address',
};

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 px-4">
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold">DealForge</span>
          </Link>
        </div>

        <Suspense fallback={<div className="h-48 animate-pulse rounded-md bg-muted" />}>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  );
}
