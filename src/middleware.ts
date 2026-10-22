import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* =========================================================
   BASIC API PROTECTION (merged in from the security hardening config)
   Per-IP rate limiting, method allow-list and body-size cap for /api/*.
   NOTE: the Map below lives in memory of ONE server instance. On Vercel /
   serverless / multiple instances, use a shared store (e.g. Upstash Redis
   @upstash/ratelimit) so limits apply across all instances.
========================================================= */
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60; // per IP per window
const MAX_BODY_BYTES = 1_000_000; // 1 MB
const ALLOWED_METHODS = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
]);

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function getIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function cleanup(now: number) {
  if (buckets.size < 5000) return;
  // forEach instead of for..of — the project compiles with target ES5.
  buckets.forEach((bucket, key) => {
    if (bucket.resetAt <= now) buckets.delete(key);
  });
}

/** API responses must never be cached by the browser. */
function apiNext() {
  const res = NextResponse.next();
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const agentToken = request.cookies.get('agentToken')?.value;
  const doctorToken = request.cookies.get('doctorToken')?.value;
  const { pathname } = request.nextUrl;

  /* ---------------------------------------------------------
     1) API protection: method allow-list, body cap, rate limit.
     --------------------------------------------------------- */
  if (pathname.startsWith('/api/')) {
    if (!ALLOWED_METHODS.has(request.method)) {
      return new NextResponse('Method Not Allowed', { status: 405 });
    }

    const len = Number(request.headers.get('content-length') || 0);
    if (len > MAX_BODY_BYTES) {
      return new NextResponse('Payload Too Large', { status: 413 });
    }

    const now = Date.now();
    cleanup(now);

    const key = getIp(request);
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      bucket.count += 1;
      if (bucket.count > MAX_REQUESTS) {
        const retry = Math.ceil((bucket.resetAt - now) / 1000);
        return new NextResponse(
          JSON.stringify({
            success: false,
            message: 'Too many requests. Please try again shortly.',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': String(retry),
            },
          }
        );
      }
    }
  }

  /* ---------------------------------------------------------
     2) Auth / redirect rules — existing behaviour, unchanged.
     --------------------------------------------------------- */
  const publicRoutes = ['/login', '/api/agents/login', '/agent-login', '/doctor-login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Patient-facing booking page linked from the public landing page. It must be
  // reachable without a session (logged-in admins keep access too).
  if (pathname === '/bookings/new') {
    return NextResponse.next();
  }

  // Public doctor registration page — the doctor does not have an account yet,
  // so it must be reachable without a session.
  if (pathname === '/doctors/register') {
    return NextResponse.next();
  }

  const adminRoutes = [
    '/dashboard',
    '/patients',
    '/doctors',
    '/agents',
    '/packages',
    '/appointments',
    '/tests',
    '/reports',
    '/doctor-booking',
    '/tasks',
    '/payments',
    '/audit',
    '/security',
    '/bookings',
    '/agents/ratings',
    '/transport',
    '/agent-booking-requests',
  ];
  const isAdminRoute =
    adminRoutes.includes(pathname) || pathname.startsWith('/dashboard/');

  const agentRoutes = ['/agent-dashboard'];
  const isAgentRoute = agentRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  const doctorRoutes = ['/doctor-dashboard'];
  const isDoctorRoute = doctorRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  const adminOnlyRoutes = ['/permissions'];
  const isAdminOnlyRoute =
    adminOnlyRoutes.includes(pathname) || pathname.startsWith('/permissions/');

  if (pathname.startsWith('/api/')) {
    if (
      pathname === '/api/auth/login' ||
      pathname === '/api/auth/verify-otp' ||
      pathname === '/api/agents/login' ||
      pathname === '/api/doctors/login'
    ) {
      return apiNext();
    }

    // No-auth public endpoints used by the landing page / public agents page:
    //   /api/public-agents            -> public agent directory
    //   /api/public/...               -> public booking requests,
    //                                    public service types, hospitals
    //   /api/medicines (GET)          -> medicine list inside the public
    //                                    booking form (POST stays protected)
    if (
      pathname === '/api/public-agents' ||
      pathname.startsWith('/api/public/') ||
      (pathname === '/api/medicines' && request.method === 'GET')
    ) {
      return apiNext();
    }

    // Public doctor registration flow (no session yet — the doctor verifies
    // their email with an OTP before the account exists):
    //   /api/doctors/register/send-otp    -> email the OTP
    //   /api/doctors/register/verify-otp  -> check the OTP
    //   /api/doctors/register             -> complete registration
    //   /api/doctors/verify-email         -> verify email of an existing doctor
    if (
      pathname === '/api/doctors/register' ||
      pathname === '/api/doctors/register/send-otp' ||
      pathname === '/api/doctors/register/verify-otp' ||
      pathname === '/api/doctors/verify-email'
    ) {
      return apiNext();
    }

    if (!token && !agentToken && !doctorToken) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }
    return apiNext();
  }

  if (isDoctorRoute) {
    if (!doctorToken) {
      return NextResponse.redirect(new URL('/doctor-login', request.url));
    }
    return NextResponse.next();
  }

  if (isAgentRoute) {
    if (!agentToken) {
      return NextResponse.redirect(new URL('/agent-login', request.url));
    }
    return NextResponse.next();
  }

  if (isAdminOnlyRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (isAdminRoute) {
    if (!token && !agentToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  if (!token && !doctorToken && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (token && isPublicRoute && pathname !== '/agent-login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/patients/:path*',
    '/doctors/:path*',
    '/agents/:path*',
    '/appointments/:path*',
    '/tests/:path*',
    '/reports/:path*',
    '/permissions/:path*',
    '/doctor-booking/:path*',
    '/agent-dashboard/:path*',
    '/doctor-dashboard/:path*',
    '/tasks/:path*',
    '/payments/:path*',
    '/audit/:path*',
    '/security/:path*',
    '/bookings/:path*',
    '/agents/ratings/:path*',
    '/login',
    '/agent-login',
    '/doctor-login',
  ],
};
