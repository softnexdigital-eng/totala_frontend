import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

async function forward(req: Request, params: { id: string }, suffix: string) {
  try {
    const bearerHeader = req.headers.get('authorization');
    const token = bearerHeader?.replace('Bearer ', '').trim() || (await getAuthToken());

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/tasks/${params.id}${suffix}`, {
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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return forward(req, params, '/receive');
}

