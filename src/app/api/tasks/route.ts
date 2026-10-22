import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

/**
 * Task list proxy.
 *
 * Rows carry the freeze flags (`isDisabled`, `awaitingEnd`, `canEnd`) computed by
 * the backend, so the Super Admin dashboard can render the disabled state and
 * enable the "End" button only after the service-charge payment is submitted.
 *
 * The token comes from the `Authorization` header (agent client) or, when absent,
 * from the admin/agent session cookie (dashboard refresh polling).
 */
export async function GET(req: Request) {
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

    const response = await fetch(`${process.env.BACKEND_URL}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    const headerToken = authHeader?.replace('Bearer ', '').trim();
    const token = headerToken || (await getAuthToken());
    const body = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

