import { type NextRequest, NextResponse } from 'next/server';

/**
 * Route protection middleware
 *
 * Protects dashboard routes and redirects unauthenticated users.
 * Also redirects authenticated users away from auth pages.
 */

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/deals', '/analyze'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/sign-in', '/sign-up'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session cookie
  const sessionCookie = request.cookies.get('better-auth.session_token');
  const isAuthenticated = !!sessionCookie;

  // Check if accessing protected route without authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Redirect authenticated users away from auth pages
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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
