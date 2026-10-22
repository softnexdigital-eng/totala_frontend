import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

/**
 * Proxy: POST /api/invoices/:id/email
 * Retries sending the invoice email after a previous failure.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/invoices/${params.id}/email`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' }
    );
    const data = await response.json().catch(() => null);
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error', data: null },
      { status: 500 }
    );
  }
}
