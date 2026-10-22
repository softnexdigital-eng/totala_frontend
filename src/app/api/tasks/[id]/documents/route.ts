import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

// PUT /api/tasks/[id]/documents  { prescriptions?: string[], invoiceUrl?: string | null }
// Forwards JSON straight to the backend (no multipart here — files go via /api/upload first).
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const bearerHeader = req.headers.get('authorization');
    const token = bearerHeader?.replace('Bearer ', '').trim() || (await getAuthToken());
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.text();
    const response = await fetch(`${process.env.BACKEND_URL}/api/tasks/${params.id}/documents`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
