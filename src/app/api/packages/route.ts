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

    const response = await fetch(`${process.env.BACKEND_URL}/api/packages`, {
      headers: { 'Authorization': `Bearer ${token}` },
      next: { revalidate: 60 },
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to fetch packages',
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

    const response = await fetch(`${process.env.BACKEND_URL}/api/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json().catch(() => ({
      success: false,
      message: 'Failed to create package',
    }));
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
