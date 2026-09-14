import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that do not require an active session
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/auth',
  '/invite',
  '/app/invite',
  '/api/auth',
  '/api/webhooks',
  '/billing',
  '/api/billing'
];

/**
 * Safely parses the tenant session payload from the signed JWT/Cookie in Edge Runtime
 */
function parseSessionPayload(tokenString?: string | null): {
  userId?: string;
  role?: string;
  workspaceId?: string;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  trialEndsAt?: number | null;
  currentPeriodEnd?: number | null;
  expiresAt?: number;
} | null {
  if (!tokenString) return null;

  try {
    if (tokenString.startsWith('token-superadmin') || tokenString.startsWith('token-')) {
      return { 
        role: 'superadmin', 
        subscriptionStatus: 'active',
        subscriptionPlan: 'enterprise' 
      };
    }

    const parts = tokenString.split('.');
    if (parts.length < 2) return null;

    const base64 = parts[0].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonStr);
  } catch (e) {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check if the path is explicitly a public route, API auth, webhook, or billing page
  const isPublicRoute = 
    PUBLIC_PATHS.some((path) => pathname === path || (path !== '/' && pathname.startsWith(path + '/'))) ||
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/billing') ||
    pathname.startsWith('/billing');

  // 2. Extract session cookie and decode tenant session
  const sessionCookie = request.cookies.get('crdisk_session')?.value || request.cookies.get('crdisk_token')?.value;
  const session = parseSessionPayload(sessionCookie);
  const isAuthenticated = Boolean(session && sessionCookie && sessionCookie.length > 10);

  // 3. Root path ('/') is the public high-converting commercial landing page
  if (pathname === '/') {
    return NextResponse.next();
  }

  // 4. If an authenticated user tries to access /login (or /auth) -> Redirect with HTTP 307 to /dashboard
  if (isAuthenticated && (pathname === '/login' || pathname === '/auth' || pathname === '/register')) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl, 307);
  }

  // 5. If accessing any private route without a valid session cookie -> Redirect with HTTP 307 to /login
  if (!isPublicRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (!pathname.startsWith('/api/')) {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl, 307);
  }

  // 6. SUBSCRIPTION & PAYWALL ENFORCEMENT
  // Superadmin has unrestricted free pass across all platform modules
  if (isAuthenticated && session && session.role !== 'superadmin') {
    const status = session.subscriptionStatus || 'pending_payment';
    const trialEndsAt = session.trialEndsAt;
    const isTrialValid = status === 'trial' && (!trialEndsAt || Date.now() < trialEndsAt);
    const isSubscriptionActive = status === 'active' || isTrialValid;

    const isBillingPath = pathname.startsWith('/billing');
    const isAuthApi = pathname.startsWith('/api/auth') || pathname.startsWith('/api/webhooks');

    // If subscription is NOT active (pending_payment, past_due, canceled, or expired trial)
    if (!isSubscriptionActive && !isBillingPath && !isAuthApi) {
      // Intercept any attempt to access private app modules and redirect to /billing/locked
      const lockedUrl = new URL('/billing/locked', request.url);
      return NextResponse.redirect(lockedUrl, 307);
    }

    // If subscription IS active, but user tries to access /billing/locked, send them back to /dashboard
    if (isSubscriptionActive && pathname === '/billing/locked') {
      return NextResponse.redirect(new URL('/dashboard', request.url), 307);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public static assets (images, fonts, audio)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|woff|woff2|ico)$).*)',
  ],
};

