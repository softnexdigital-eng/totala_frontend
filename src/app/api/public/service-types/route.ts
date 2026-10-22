import { NextResponse } from 'next/server';

/**
 * Public (no-auth) endpoint used by the landing page booking search bar
 * dropdown and the Booking Request modal.
 *
 * Proxies the backend `GET /api/service-types/public` route, which returns
 * only the *active* service types. The regular `/api/service-types` route is
 * super-admin protected, so anonymous visitors must go through this route.
 */
export async function GET() {
  try {
    const response = await fetch(
      `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/service-types/public`,
      {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
      }
    );

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Invalid response from server', data: [] },
        { status: 502 }
      );
    }

    const data = await response.json().catch(() => null);
    if (!data || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data?.message || 'Failed to fetch service types',
          data: [],
        },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ success: true, data: data.data || [] });
  } catch {
    return NextResponse.json(
      { success: false, message: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
