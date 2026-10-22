import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

export async function GET(req: Request) {
  try {
    const token = await getAuthToken();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { search } = new URL(req.url);
    const response = await fetch(
      `${process.env.BACKEND_URL}/api/doctors/registrations${search}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      }
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}