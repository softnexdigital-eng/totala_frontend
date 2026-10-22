/**
 * Public (no-auth) proxy for the booking email-OTP request.
 *
 * Step 1 of the anti-fake booking flow:
 *   POST /api/public/booking-otp/request  { email }
 *     -> backend sends a 6-digit OTP to that email (rate limited per email/IP).
 *
 * Goes through a Next.js route because the browser may only call same-origin
 * `/api/*` (CSP connect-src 'self'). The visitor's IP/UA headers are forwarded
 * so backend per-IP rate limits still apply to the real visitor.
 */
import { NextResponse } from 'next/server';
import { backendJson, forwardClientHeaders, readJsonBody } from '@/lib/serverProxy';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim();
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'ইমেইল প্রয়োজন', data: null, error: 'Email required' },
        { status: 400 }
      );
    }

    const result = await backendJson(`${BACKEND}/api/bookings/request-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardClientHeaders(req),
      },
      body: JSON.stringify({ email }),
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.data?.message ||
            (result.status === 0
              ? 'Could not reach the booking service. Please try again.'
              : 'OTP পাঠানো যায়নি — আবার চেষ্টা করুন'),
          data: null,
          error: result.data?.error || null,
        },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error', data: null, error: null },
      { status: 500 }
    );
  }
}
