import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const REDIRECTS: Record<string, string> = {
  '/dashboard/wallets': '/dashboard/authority',
  '/dashboard/demo/robinhood': '/dashboard/assets',
  '/dashboard/demo/robinhood-tsla': '/dashboard/assets',
  '/onboarding': '/dashboard',
  '/dashboard/register-agent': '/dashboard/agents/studio',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const exact = REDIRECTS[pathname];
  if (exact) {
    return NextResponse.redirect(new URL(exact, request.url));
  }

  if (pathname.startsWith('/dashboard/demo/robinhood/')) {
    const ticker = pathname.replace('/dashboard/demo/robinhood/', '');
    return NextResponse.redirect(new URL(`/dashboard/assets/${ticker}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/wallets',
    '/dashboard/demo/robinhood',
    '/dashboard/demo/robinhood/:path*',
    '/onboarding',
    '/dashboard/register-agent',
  ],
};
