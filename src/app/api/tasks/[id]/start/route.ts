import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';

async function forward(req: Request, params: { id: string }, backendSuffix: string, method = 'PUT') {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '').trim() || (await getAuthToken());
    const contentType = req.headers.get('content-type') || '';
    const isMultipart = contentType.includes('multipart/form-data');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Binary file uploads must be forwarded as-is (no JSON re-encoding)
    // so multer on the backend still sees req.file / req.files.
    let body: BodyInit | undefined;
    const headers: Record<string, string> = { 'Authorization': `Bearer ${token}` };
    if (['PUT', 'POST', 'PATCH'].includes(method)) {
      if (isMultipart) {
        body = await req.arrayBuffer();
        headers['Content-Type'] = contentType;
      } else {
        const text = await req.text();
        if (text) {
          body = text;
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    const response = await fetch(`${process.env.BACKEND_URL}/api/tasks/${params.id}${backendSuffix}`, {
      method,
      headers,
      body,
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
  return forward(req, params, '/start');
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return forward(req, params, '/documents', 'PUT');
}
