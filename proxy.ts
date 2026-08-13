import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Server-side route protection.
 *
 * Next.js 16 renamed Middleware to Proxy: the file must be `proxy.ts` and the
 * export `proxy`. `middleware.ts` still runs but logs a deprecation warning.
 *
 * Admin gating used to be entirely client-side (a useEffect redirect in
 * AppShell), which meant admin page bundles shipped to every visitor and the
 * page always painted one frame before bouncing. This stops the request first.
 *
 * Per the Next 16 docs, Proxy is for *optimistic* checks only — never the sole
 * authorization layer. Every API route still calls verifyAdmin() itself; this
 * is defence in depth for navigations.
 */

const ADMIN_ROUTES = [
  '/', '/members', '/analytics', '/requests',
  '/audit', '/export', '/attendance', '/expiry', '/setup',
];

async function isAdmin(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const secret = process.env.ADMIN_SECRET;
  if (!secret || secret.length < 32) return false;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] }
    );
    return payload.isAdmin === true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!ADMIN_ROUTES.includes(pathname)) return NextResponse.next();

  if (await isAdmin(request.cookies.get('admin_session')?.value)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/landing';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  // Everything except API routes (they authenticate themselves), Next internals,
  // and static files.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon-.*\\.png|manifest.json|sw.js|.*\\.svg).*)'],
};
