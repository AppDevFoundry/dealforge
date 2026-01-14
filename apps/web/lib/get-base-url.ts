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

  // Vercel: use system env vars (doesn't include protocol)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Explicit override (useful for local dev or custom domains)
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }

  // Local development fallback
  return 'http://localhost:3000';
}
