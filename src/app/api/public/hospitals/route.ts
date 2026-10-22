import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/public/hospitals`, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 },
    });

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { success: false, message: 'Invalid response from server' },
        { status: 502 }
      );
    }

    const data = await response.json().catch(() => null);
    if (!data || !data.success) {
      return NextResponse.json(
        { success: false, message: data?.message || 'Failed to fetch hospitals', data: [] },
        { status: response.status || 500 }
      );
    }

    const activeHospitals = (data.data || []);
    return NextResponse.json({ success: true, data: activeHospitals });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
