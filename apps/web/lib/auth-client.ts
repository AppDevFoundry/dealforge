'use client';

import { createAuthClient } from 'better-auth/react';
import { getBaseUrl } from './get-base-url';

/**
 * BetterAuth client for React components
 *
 * Use these hooks and functions in client components
 * for authentication operations.
 */
export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;
