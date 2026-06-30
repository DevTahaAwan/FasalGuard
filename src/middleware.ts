import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Basic route protection mock for FasalGuard
  // In a real app with Supabase, this would check the Supabase session
  const hasSession = request.cookies.has('sb-access-token'); 
  
  const protectedRoutes = ['/history', '/profile'];
  
  const isProtected = protectedRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  );

  if (isProtected && !hasSession) {
    // For this prototype we won't strictly enforce auth for history
    // so users can test the UI offline, but here is where it goes.
    // return NextResponse.redirect(new URL('/auth', request.url));
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
     * - sw.js (service worker)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js).*)',
  ],
};
