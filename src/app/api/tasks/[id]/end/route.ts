import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

/**
 * PUT /api/tasks/[id]/end  (server-side proxy)
 *
 * Super Admin only — the dashboard "End" button. The backend accepts the call
 * only when the agent's service-charge payment has been submitted
 * (taskStatus === SERVICE_COMPLETED), completing the task and unfreezing the
 * agent so new bookings become possible again.
 *
 * The token is taken from the incoming `Authorization` header when present
 * (agent/mobile clients) and otherwise from the admin session cookie, so the
 * dashboard client can call this route directly.
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.replace('Bearer ', '').trim();
    const token = headerToken || (await getAuthToken());

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/tasks/${params.id}/end`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body ?? {}),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
