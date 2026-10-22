import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch(`${process.env.BACKEND_URL}/api/doctors/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.success) {
      // Remove any existing admin/agent session cookies so the doctor session
      // never inherits the super admin's menus or data (cookies are shared
      // across all tabs of the same browser).
      cookies().set('token', '', { path: '/', maxAge: 0 });
      cookies().set('user', '', { path: '/', maxAge: 0 });
      cookies().set('agentToken', '', { path: '/', maxAge: 0 });
      cookies().set('agent', '', { path: '/', maxAge: 0 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
