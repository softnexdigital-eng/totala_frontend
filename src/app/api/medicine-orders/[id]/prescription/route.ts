import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(
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
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Forward as multipart to backend
    const backendForm = new FormData();
    backendForm.append('file', file);

    const response = await fetch(
      `${BACKEND}/api/medicines/orders/${encodeURIComponent(id)}/prescription`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: backendForm,
      }
    );

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
