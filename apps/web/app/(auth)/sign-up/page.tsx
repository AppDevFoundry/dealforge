import { SignUpForm } from '@/components/auth/sign-up-form';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sign Up',
  description: 'Create your DealForge account',
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 px-4">
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold">DealForge</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Get started with DealForge - it&apos;s free to analyze your first deals
          </p>
        </div>

        <Suspense fallback={<div className="h-80 animate-pulse rounded-md bg-muted" />}>
          <SignUpForm />
        </Suspense>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
