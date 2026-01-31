'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signIn } from '@/lib/auth-client';
import { Check, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GoogleIcon } from './google-icon';

/**
 * Password requirements validation
 */
function validatePassword(password: string) {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  };
}

function PasswordRequirement({ met, label }: { met: boolean; label: string }) {
  return (
    <div
      className={`flex items-center gap-2 text-xs ${met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}
    >
      {met ? <Check className="size-3" /> : <X className="size-3" />}
      <span>{label}</span>
    </div>
  );
}

export function SignUpForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordValidation = useMemo(() => validatePassword(password), [password]);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please ensure your password meets all requirements');
      return;
    }

    setLoading(true);

    try {
      // Use secure signup endpoint that doesn't reveal if email exists
      const response = await fetch('/api/auth/secure-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signIn.social({
        provider: 'google',
        callbackURL: '/dashboard',
      });
    } catch {
      setError('Failed to initiate Google sign in');
    }
  };

  if (success) {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4">
          <h3 className="font-medium text-green-800 dark:text-green-200">Check your email</h3>
          <p className="mt-2 text-sm text-green-700 dark:text-green-300">
            If an account needs verification, we've sent a link to <strong>{email}</strong>. Click
            the link to verify your account.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Didn't receive the email? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="text-primary underline-offset-4 hover:underline"
          >
            try again
          </button>
          . Already verified?{' '}
          <a href="/sign-in" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSignUp} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <div className="space-y-1 pt-1">
            <PasswordRequirement met={passwordValidation.minLength} label="At least 8 characters" />
            <PasswordRequirement
              met={passwordValidation.hasUppercase}
              label="One uppercase letter"
            />
            <PasswordRequirement
              met={passwordValidation.hasLowercase}
              label="One lowercase letter"
            />
            <PasswordRequirement met={passwordValidation.hasNumber} label="One number" />
            <PasswordRequirement
              met={passwordValidation.hasSpecial}
              label="One special character (!@#$%...)"
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || !isPasswordValid}>
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button variant="outline" onClick={handleGoogleSignIn} disabled={loading} className="w-full">
        <GoogleIcon className="mr-2 size-5" />
        Continue with Google
      </Button>
    </div>
  );
}
