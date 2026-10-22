import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getAuthToken();
    const body = await req.json();

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(
      `${process.env.BACKEND_URL}/api/doctors/${params.id}/registration-status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
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