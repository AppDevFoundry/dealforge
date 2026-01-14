import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

/**
 * Get the current session on the server side
 *
 * Use in Server Components and Route Handlers.
 */
export async function getServerSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
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
