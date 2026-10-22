/**
 * Public (no-auth) proxy for the booking email-OTP verification.
 *
 * Step 2 of the anti-fake booking flow:
 *   POST /api/public/booking-otp/verify  { email, otp }
 *     -> returns { bookingToken } (single-use, 15 min TTL).
 *
 * The booking can only be created afterwards with that bookingToken.
 * IP/UA headers are forwarded so wrong-OTP auto-blocking targets the real IP.
 */
import { NextResponse } from 'next/server';
import { backendJson, forwardClientHeaders, readJsonBody } from '@/lib/serverProxy';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);
    const email = String(body.email || '').trim();
    const otp = String(body.otp || '').trim();
    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'ইমেইল ও OTP প্রয়োজন', data: null, error: 'Email and OTP required' },
        { status: 400 }
      );
    }

    const result = await backendJson(`${BACKEND}/api/bookings/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardClientHeaders(req),
      },
      body: JSON.stringify({ email, otp }),
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            result.data?.message ||
            (result.status === 0
              ? 'Could not reach the booking service. Please try again.'
              : 'OTP যাচাই ব্যর্থ হয়েছে'),
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
