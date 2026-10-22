import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

/**
 * Proxy: GET /api/invoices/:id  (id = appointment id)
 * Fetches (or lazily creates) the invoice for an appointment.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/invoices/appointment/${params.id}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, cache: 'no-store' }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error', data: null },
      { status: 500 }
    );
  }
}
