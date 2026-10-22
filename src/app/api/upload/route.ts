import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

// POST /api/upload?type=prescriptions|receipts|reports  (multipart, field: file/files)
// Forwards the raw multipart body to the backend so multer still parses it.
export async function POST(req: NextRequest) {
  try {
    const bearerHeader = req.headers.get('authorization');
    const token = bearerHeader?.replace('Bearer ', '').trim() || (await getAuthToken());
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const contentType = req.headers.get('content-type') || '';
    const body = await req.arrayBuffer();
    const target = `${process.env.BACKEND_URL}/api/upload/file${req.nextUrl.search}`;
    const response = await fetch(target, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': contentType },
      body,
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
