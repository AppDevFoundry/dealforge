import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.VERCEL_ENV === 'preview';

/**
 * Get the current session on the server side
 *
 * Use in Server Components and Route Handlers.
 */
export async function getServerSession() {
  const reqHeaders = await headers();

  if (DEBUG_AUTH) {
    console.log('[getServerSession] Checking session with headers:', {
      cookie: reqHeaders.get('cookie')?.substring(0, 100) + '...',
      host: reqHeaders.get('host'),
    });
  }

  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (DEBUG_AUTH) {
    console.log('[getServerSession] Session result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
    });
  }

  return session;
}

/**
 * Require authentication - redirects if not authenticated
 *
 * Use in protected Server Components.
 * Throws an error if not authenticated (handle in parent).
 */
export async function requireAuth() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Get the current user or null
 *
 * Convenience function for optional auth checks.
 */
export async function getCurrentUser() {
  const session = await getServerSession();
  return session?.user ?? null;
}
