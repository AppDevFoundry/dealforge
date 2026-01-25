import { getDb } from '@dealforge/database';
import { users } from '@dealforge/database/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';

import { auth } from '@/lib/auth';

const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.VERCEL_ENV === 'preview';

/** User role type */
export type UserRole = 'user' | 'admin' | 'owner';

/**
 * Get the current session on the server side
 *
 * Use in Server Components and Route Handlers.
 */
export async function getServerSession() {
  const reqHeaders = await headers();

  if (DEBUG_AUTH) {
    console.log('[getServerSession] Checking session with headers:', {
      cookie: `${reqHeaders.get('cookie')?.substring(0, 100)}...`,
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

/**
 * Get the user's role from the database
 *
 * Returns the role or 'user' as default.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const db = getDb();
  const result = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return (result[0]?.role as UserRole) ?? 'user';
}

/**
 * Check if the current user is an admin
 *
 * Returns true if the user has admin or owner role.
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return false;
  }

  const role = await getUserRole(session.user.id);
  return role === 'admin' || role === 'owner';
}

/**
 * Require admin role - throws if not admin
 *
 * Use in protected admin Server Components and Route Handlers.
 * Throws an error if not authenticated or not an admin.
 */
export async function requireAdmin() {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }

  const role = await getUserRole(session.user.id);
  if (role !== 'admin' && role !== 'owner') {
    throw new Error('Forbidden: Admin access required');
  }

  return { session, role };
}
