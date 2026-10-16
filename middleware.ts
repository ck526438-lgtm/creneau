import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const COOKIE_NAME = 'creneau_session';

function secretKey() {
  const secret = process.env.SESSION_SECRET || 'dev-secret-please-replace-in-production-0123456789';
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  let signedIn = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey());
      signedIn = true;
    } catch {
      signedIn = false;
    }
  }

  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isDashboard && !signedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && signedIn && !request.nextUrl.searchParams.has('expired')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};
