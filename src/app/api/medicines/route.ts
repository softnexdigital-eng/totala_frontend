import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND}/api/medicines`, {
      headers: { 'Accept': 'application/json' },
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
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const response = await fetch(`${BACKEND}/api/medicines`, {
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
