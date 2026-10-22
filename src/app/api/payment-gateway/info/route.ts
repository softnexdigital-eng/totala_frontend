import { NextResponse } from 'next/server';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Proxy: GET /api/payment-gateway/info
 * Returns supported dummy payment methods + testing banner label.
 */
export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/api/payment-gateway/info`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => null);
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Payment gateway unavailable', data: null },
      { status: 502 }
    );
  }
}
