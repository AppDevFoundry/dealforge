'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * BetterAuth client for React components
 *
 * Use these hooks and functions in client components
 * for authentication operations.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
