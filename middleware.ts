import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'auth-token';
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ai-call-analytics-secret-key-2024'
);

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authenticated = await isAuthenticated(request);

  // Authenticated users visiting /login → redirect to /
  if (pathname === '/login' && authenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Protected page routes (including home page)
  if (pathname === '/' || pathname.startsWith('/analyze') || pathname.startsWith('/compare')) {
    if (!authenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protected API routes (exclude /api/logout so users can always log out)
  if (pathname.startsWith('/api/') && pathname !== '/api/logout') {
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/analyze/:path*',
    '/compare/:path*',
    '/api/:path*',
    '/login',
  ],
};
