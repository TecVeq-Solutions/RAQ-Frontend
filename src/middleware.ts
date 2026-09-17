import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const tenantToken = request.cookies.get('auth_token')?.value;
  const superAdminToken = request.cookies.get('super_admin_token')?.value;

  const isSuperAdminLoginPage = pathname === '/super-admin-login';
  const isSuperAdminRoute = pathname.startsWith('/super-admin') && !isSuperAdminLoginPage;

  const isTenantLoginPage = pathname === '/login';

  // --------------------------------------------------------------------------
  // 1. Super Admin Authentication Routing
  // --------------------------------------------------------------------------
  if (isSuperAdminLoginPage) {
    if (superAdminToken) {
      return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
    }
    return NextResponse.next();
  }

  if (isSuperAdminRoute) {
    if (!superAdminToken) {
      const loginUrl = new URL('/super-admin-login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // --------------------------------------------------------------------------
  // 2. Tenant ERP Authentication Routing
  // --------------------------------------------------------------------------
  if (isTenantLoginPage) {
    if (tenantToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Root redirect
  if (pathname === '/') {
    if (superAdminToken) {
      return NextResponse.redirect(new URL('/super-admin/dashboard', request.url));
    }
    if (tenantToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Protected Tenant Route Guard
  if (!tenantToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static asset extensions
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
