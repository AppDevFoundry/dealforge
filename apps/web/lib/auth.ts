import { getDb } from '@dealforge/database';
import { accounts, sessions, users, verifications } from '@dealforge/database/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { Resend } from 'resend';
import { getBaseUrl } from './get-base-url';

// Initialize Resend for email verification
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.VERCEL_ENV === 'preview';

// Compute config values
const baseURL = getBaseUrl();

// Use static 'df' cookie prefix everywhere
// Note: Dynamic port-specific prefixes were removed because auth.ts and middleware.ts
// calculated ports differently (configured URL vs request Host header), causing mismatches
const getCookiePrefix = (): string => {
  return 'df';
};

const trustedOrigins = [
  baseURL,
  // Always trust common local dev ports (Next.js increments when port is in use)
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  // Trust production URL from preview deployments (for OAuth callbacks)
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,
  // Trust branch URL for preview deployments (alternative URL format)
  process.env.VERCEL_BRANCH_URL ? `https://${process.env.VERCEL_BRANCH_URL}` : null,
].filter(Boolean) as string[];

// Debug log auth configuration at initialization
if (DEBUG_AUTH) {
  console.log('[auth] BetterAuth configuration:', {
    baseURL,
    trustedOrigins,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
}

/**
 * BetterAuth server configuration
 *
 * This sets up authentication with:
 * - Email/password authentication with email verification via Resend
 * - Google OAuth provider with account linking
 * - Database sessions stored in Neon PostgreSQL
 */
export const auth = betterAuth({
  baseURL,
  trustedOrigins,

  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema: {
      user: users,
      account: accounts,
      session: sessions,
      verification: verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      console.log('[auth] sendResetPassword called for:', user.email);

      if (!resend) {
        console.warn('[auth] Resend not configured, skipping password reset email');
        return;
      }

      const fromEmail = process.env.EMAIL_FROM || 'DealForge <noreply@dealforge.app>';

      try {
        const result = await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: 'Reset your DealForge password',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Reset Your Password</h2>
              <p style="color: #4a4a4a; line-height: 1.6;">
                We received a request to reset your password. Click the button below to set a new password.
              </p>
              <a href="${url}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Reset Password
              </a>
              <p style="color: #6a6a6a; font-size: 14px;">
                If you didn't request this, you can safely ignore this email. This link will expire in 1 hour.
              </p>
            </div>
          `,
        });
        console.log('[auth] Password reset email sent:', result);
      } catch (error) {
        console.error('[auth] Failed to send password reset email:', error);
        throw error;
      }
    },
  },

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      console.log('[auth] sendVerificationEmail called for:', user.email);
      console.log('[auth] Original verification URL:', url);

      if (!resend) {
        console.warn(
          '[auth] Resend not configured (no RESEND_API_KEY), skipping verification email'
        );
        return;
      }

      // Modify the verification URL to redirect to dashboard after verification
      const verificationUrl = new URL(url);
      verificationUrl.searchParams.set('callbackURL', '/dashboard?verified=true');
      const finalUrl = verificationUrl.toString();
      console.log('[auth] Modified verification URL:', finalUrl);

      const fromEmail = process.env.EMAIL_FROM || 'DealForge <noreply@dealforge.app>';
      console.log('[auth] Sending verification email from:', fromEmail);

      try {
        const result = await resend.emails.send({
          from: fromEmail,
          to: user.email,
          subject: 'Verify your DealForge account',
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a1a1a;">Welcome to DealForge!</h2>
              <p style="color: #4a4a4a; line-height: 1.6;">
                Thanks for signing up. Please verify your email address by clicking the button below.
              </p>
              <a href="${finalUrl}" style="display: inline-block; background-color: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                Verify Email Address
              </a>
              <p style="color: #6a6a6a; font-size: 14px;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </div>
          `,
        });
        console.log('[auth] Resend API response:', result);
      } catch (error) {
        console.error('[auth] Failed to send verification email:', error);
        throw error;
      }
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },

  accountLinking: {
    enabled: true,
    trustedProviders: ['google'],
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute cache
    },
  },

  advanced: {
    cookiePrefix: getCookiePrefix(),
  },
});

export type Session = typeof auth.$Infer.Session;
