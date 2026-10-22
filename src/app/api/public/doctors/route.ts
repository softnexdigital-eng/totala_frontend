import { NextResponse } from 'next/server';

/**
 * Public Doctor directory — powers the doctor selector on the landing-page
 * "Doctor Appointment with Patient Assistance" booking form.
 *
 * Proxies to the backend's GET /api/public/doctors (active, approved doctors
 * only) and revalidates every 60s so newly approved doctors appear quickly.
 */
export async function GET() {
  try {
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:5000'}/api/public/doctors`, {
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
        { success: false, message: data?.message || 'Failed to fetch doctors', data: [] },
        { status: response.status || 500 }
      );
    }

    const activeDoctors = (data.data || []).filter((d: { isActive: boolean }) => d.isActive);
    return NextResponse.json({ success: true, data: activeDoctors });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Internal server error', data: [] },
      { status: 500 }
    );
  }
}
