import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the request is for admin routes
  if (pathname.startsWith('/admin')) {
    // Get user data from localStorage (this will be handled client-side)
    // For now, we'll let the admin layout handle the authentication
    // since Next.js middleware runs on the server and can't access localStorage
    
    // You could implement server-side session checking here if using cookies
    // For JWT tokens in localStorage, client-side protection is more appropriate
    
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};