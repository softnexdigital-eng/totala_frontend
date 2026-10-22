import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const response = await fetch(`${BACKEND}/api/medicines/orders/${encodeURIComponent(id)}/audit`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
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
