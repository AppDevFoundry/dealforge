import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

/**
 * BetterAuth API route handler
 *
 * This catch-all route handles all authentication endpoints:
 * - POST /api/auth/sign-up - Email registration
 * - POST /api/auth/sign-in/email - Email login
 * - POST /api/auth/sign-in/social - OAuth login
 * - GET /api/auth/session - Get current session
 * - POST /api/auth/sign-out - Sign out
 * - POST /api/auth/forget-password - Password reset request
 * - POST /api/auth/reset-password - Password reset
 * - GET /api/auth/verify-email - Email verification
 * - OAuth callback routes for Google/GitHub
 */
export const { POST, GET } = toNextJsHandler(auth);
