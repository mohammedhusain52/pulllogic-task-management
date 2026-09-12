import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('pulllogic_session')?.value;

  // Public paths that do not require authentication
  const isPublicPath =
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/pull-logic-logo.png' ||
    pathname === '/pull-logic-mark.png' ||
    pathname === '/pull-logic-mark.svg' ||
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    pathname === '/icon.png' ||
    pathname === '/icon.svg' ||
    pathname.startsWith('/uploads/');

  // If user is accessing public path like /login and is already logged in
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If accessing a protected page/API and not logged in
  if (!isPublicPath && !token) {
    // For API requests, return 401 JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized. Please login.' }, { status: 401 });
    }
    // For page requests, redirect to /login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    '/((?!_next/static|_next/image|favicon.ico|favicon.svg|pull-logic-logo.png|pull-logic-mark.png|pull-logic-mark.svg|icon.png|icon.svg).*)',
  ],
};
