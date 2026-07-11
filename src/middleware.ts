import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Force aggressive no-cache on all HTML pages
  if (request.nextUrl.pathname.match(/\/(user|feed|profile|settings)/)) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('CDN-Cache-Control', 'no-store');
    response.headers.set('Vercel-CDN-Cache-Control', 'no-store');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('X-Version', Date.now().toString());
  }
  
  return response;
}

export const config = {
  matcher: [
    '/user/:path*',
    '/feed',
    '/profile',
    '/settings',
  ],
};
