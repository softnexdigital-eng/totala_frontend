import { NextResponse } from 'next/server';
import { forwardClientHeaders } from '@/lib/serverProxy';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

/**
 * Proxy: POST /api/payment-gateway/verify
 * Confirms a dummy gateway transaction as success/failure.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const res = await fetch(`${BACKEND}/api/payment-gateway/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...forwardClientHeaders(req) },
      body: JSON.stringify(body),
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
