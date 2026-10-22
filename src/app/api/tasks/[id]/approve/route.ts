import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

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

    const response = await fetch(`${process.env.BACKEND_URL}/api/tasks/${params.id}/approve`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
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
