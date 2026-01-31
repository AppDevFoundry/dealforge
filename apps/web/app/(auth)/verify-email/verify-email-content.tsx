'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Status = 'loading' | 'success' | 'error';

export function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'error');

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=${encodeURIComponent('/dashboard')}`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (status !== 'success') return;

    const timer = setTimeout(() => {
      window.location.href = '/sign-in?verified=true';
    }, 2000);

    return () => clearTimeout(timer);
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Verifying your email…</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-600 dark:text-green-400"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
        </div>
        <h3 className="text-lg font-semibold">Your email has been verified!</h3>
        <p className="text-sm text-muted-foreground">Redirecting you to sign in…</p>
        <Link
          href="/sign-in?verified=true"
          className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
        >
          Sign in now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M15 9l-6 6" />
            <path d="M9 9l6 6" />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-semibold">Verification failed</h3>
      <p className="text-sm text-muted-foreground">
        The link may have expired. Please sign up again to receive a new verification email.
      </p>
      <Link
        href="/sign-up"
        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
      >
        Back to sign up
      </Link>
    </div>
  );
}
