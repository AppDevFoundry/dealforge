import { getDb } from '@dealforge/database';
import { accounts, sessions, users, verifications } from '@dealforge/database/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { Resend } from 'resend';
import { getBaseUrl } from './get-base-url';

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

const resend = new Resend(process.env.RESEND_API_KEY);

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
  },

  emailVerification: {
    async sendVerificationEmail({ user, url }: { user: { email: string }; url: string }) {
      const token = new URL(url).searchParams.get('token');
      const verifyUrl = `${baseURL}/verify-email?token=${token}`;

      const { error } = await resend.emails.send({
        from: 'noreply@dealforge.com',
        to: user.email,
        subject: 'Verify your DealForge email',
        html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
              <h2 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Verify your email</h2>
              <p style="color: #6b7280; margin-bottom: 24px; line-height: 1.5;">
                Click the button below to verify your email address and complete your DealForge registration.
              </p>
              <a href="${verifyUrl}" style="display: inline-block; background-color: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                Verify Email
              </a>
              <p style="color: #9ca3af; margin-top: 32px; font-size: 12px; line-height: 1.5;">
                If you didn&apos;t create a DealForge account, you can safely ignore this email.<br />
                This link will expire in 24 hours.
              </p>
              <p style="color: #9ca3af; margin-top: 16px; font-size: 12px;">
                Or copy and paste this link: <a href="${verifyUrl}" style="color: #6b7280;">${verifyUrl}</a>
              </p>
            </div>
          `,
        text: `Verify your DealForge email\n\nClick this link to verify your email address:\n\n${verifyUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create a DealForge account, you can safely ignore this email.`,
      });

      if (error) {
        console.error('[auth] Failed to send verification email:', error);
        throw new Error('Failed to send verification email. Please try again later.');
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
