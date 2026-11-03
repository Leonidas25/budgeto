import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/',
  '/transactions',
  '/budgets',
  '/gamification',
  '/settings',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/onboarding',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the auth token from cookies or headers
  const authToken = request.cookies.get('auth_token')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '');

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );

  // If accessing a protected route without authentication
  if (isProtectedRoute && !authToken) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If accessing a public route while authenticated, redirect to dashboard
  if (isPublicRoute && authToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Add CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return response;
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
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};