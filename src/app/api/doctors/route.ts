import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

export async function GET() {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/doctors`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store',
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to fetch doctors',
    }));
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
    const token = await getAuthToken();
    const body = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to create doctor',
    }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
