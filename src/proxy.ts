import { type NextRequest, NextResponse } from 'next/server';

interface DecodedJwt {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
}

function parseJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/admin'];
// Routes only for unauthenticated users
const AUTH_ROUTES = ['/login', '/register'];
// Routes that are always public (no auth check needed)
const PUBLIC_ROUTES = ['/review', '/api'];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip auth check for public review pages and API routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const token = request.cookies.get('access_token')?.value;
  const payload = token ? parseJwt(token) : null;
  const isExpired = payload?.exp ? Date.now() >= payload.exp * 1000 : false;
  const isAuthenticated = Boolean(payload && !isExpired);
  const userRole = payload?.role?.toLowerCase() || '';

  // 1. Protected Admin route: must be authenticated AND super_admin
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (userRole !== 'super_admin') {
      // Standard business owner cannot access admin panel
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 2. Protected Dashboard route: must be authenticated
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 3. Prevent logged-in users from accessing login/register pages
  if (AUTH_ROUTES.some((route) => pathname.startsWith(route)) && isAuthenticated) {
    if (userRole === 'super_admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public assets (.svg, .png, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
