import { getDb } from '@dealforge/database';
import { accounts, sessions, users, verifications } from '@dealforge/database/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getBaseUrl } from './get-base-url';

const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.VERCEL_ENV === 'preview';

// Compute config values
const baseURL = getBaseUrl();
const trustedOrigins = [
  baseURL,
  // Trust production URL from preview deployments (for OAuth callbacks)
  process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null,
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
 * - Email/password authentication
 * - Google and GitHub OAuth providers
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
    requireEmailVerification: false, // Enable when email service is set up
    minPasswordLength: 8,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session daily
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute cache
    },
  },
});

export type Session = typeof auth.$Infer.Session;
