import { Button } from '@/components/ui/button';
import Link from 'next/link';

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

        {/* Placeholder form - will be replaced with BetterAuth */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Your name"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <Button className="w-full">Create Account</Button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline">Google</Button>
          <Button variant="outline">GitHub</Button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          By creating an account, you agree to our{' '}
          <a href="#" className="underline">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
