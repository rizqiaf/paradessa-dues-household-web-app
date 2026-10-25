import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets, images, manifest, and public auth APIs
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/manifest.json') ||
    pathname.startsWith('/icons')
  ) {
    return NextResponse.next();
  }

  const sessionToken = request.cookies.get('paradessa_session')?.value;

  // If on login page and already has session, redirect to home
  if (pathname === '/login') {
    if (sessionToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If accessing protected routes without session, redirect to login
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    // Don't append callbackUrl for root to keep URL clean
    if (pathname !== '/') {
      loginUrl.searchParams.set('from', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

