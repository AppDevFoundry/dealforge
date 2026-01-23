const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.VERCEL_ENV === 'preview';

/**
 * Get the base URL for the application.
 *
 * Priority:
 * 1. Browser: uses window.location.origin
 * 2. Vercel: uses VERCEL_URL system env var
 * 3. Explicit: uses BETTER_AUTH_URL if set
 * 4. Fallback: localhost:3000 for local dev
 */
export function getBaseUrl(): string {
  // Browser: use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Debug: log all relevant env vars on server
  if (DEBUG_AUTH) {
    console.log('[getBaseUrl] Environment vars:', {
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });
  }

  // Vercel: use system env vars (doesn't include protocol)
  if (process.env.VERCEL_URL) {
    const url = `https://${process.env.VERCEL_URL}`;
    if (DEBUG_AUTH) console.log('[getBaseUrl] Using VERCEL_URL:', url);
    return url;
  }

  // Explicit override (useful for local dev or custom domains)
  if (process.env.BETTER_AUTH_URL) {
    if (DEBUG_AUTH) console.log('[getBaseUrl] Using BETTER_AUTH_URL:', process.env.BETTER_AUTH_URL);
    return process.env.BETTER_AUTH_URL;
  }

  // Local development fallback - check PORT env var or default to 3000
  const port = process.env.PORT || '3000';
  const url = `http://localhost:${port}`;
  if (DEBUG_AUTH) console.log('[getBaseUrl] Using fallback:', url);
  return url;
}
