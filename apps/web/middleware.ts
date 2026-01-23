import { type NextRequest, NextResponse } from 'next/server';

const DEBUG_AUTH = process.env.DEBUG_AUTH === 'true' || process.env.VERCEL_ENV === 'preview';

/**
 * Route protection middleware
 *
 * Protects dashboard routes and redirects unauthenticated users to sign-in.
 */

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/deals', '/analyze', '/mh-parks'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie - BetterAuth uses __Secure- prefix on HTTPS (production)
  const sessionCookie =
    request.cookies.get('better-auth.session_token') ||
    request.cookies.get('__Secure-better-auth.session_token');
  const sessionDataCookie =
    request.cookies.get('better-auth.session_data') ||
    request.cookies.get('__Secure-better-auth.session_data');
  const isAuthenticated = !!sessionCookie;

  // Debug logging
  if (DEBUG_AUTH && (pathname.startsWith('/sign-in') || pathname.startsWith('/dashboard'))) {
    const allCookies = request.cookies.getAll().map((c) => c.name);
    console.log('[middleware] Auth debug:', {
      pathname,
      host: request.headers.get('host'),
      allCookies,
      sessionCookie: sessionCookie ? 'present' : 'missing',
      sessionDataCookie: sessionDataCookie ? 'present' : 'missing',
      isAuthenticated,
    });
  }

  // Check if accessing protected route without authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    if (DEBUG_AUTH) console.log('[middleware] Redirecting to sign-in, no session cookie');
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Note: We intentionally do NOT redirect authenticated users away from auth pages
  // in middleware. Cookie existence doesn't guarantee a valid session (it may be expired),
  // and redirecting here causes infinite loops when the session is stale.
  // The sign-in page handles the "already authenticated" case client-side instead.

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (they handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, etc.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)',
  ],
};
