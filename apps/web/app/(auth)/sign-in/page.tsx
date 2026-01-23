import { SignInForm } from '@/components/auth/sign-in-form';
import { getServerSession } from '@/lib/auth-server';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your DealForge account',
};

export default async function SignInPage() {
  // If user is already authenticated with a valid session, redirect to dashboard
  const session = await getServerSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto w-full max-w-md space-y-6 px-4">
        <div className="space-y-2 text-center">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold">DealForge</span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account to continue analyzing deals
          </p>
        </div>

        <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-muted" />}>
          <SignInForm />
        </Suspense>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="underline underline-offset-4 hover:text-primary">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
