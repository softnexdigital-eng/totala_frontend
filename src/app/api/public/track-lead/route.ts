/**
 * Public (no-auth) proxy for the half-form / drop-off lead tracker.
 *
 *   POST /api/public/track-lead  { email?, phone?, name?, fieldName, formStage? }
 *
 * Called on blur / debounce while the visitor types the booking form so the
 * admin "Security > Drop-off Leads" tab shows who abandoned a half-filled
 * booking. Fire-and-forget from the client; errors pass through as-is.
 */
import { NextResponse } from 'next/server';
import { backendJson, forwardClientHeaders, readJsonBody } from '@/lib/serverProxy';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);

    const result = await backendJson(`${BACKEND}/api/bookings/track-lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardClientHeaders(req),
      },
      body: JSON.stringify(body),
    });

    if (!result.ok) {
      // Lead tracking must never surface an error to the user — return a soft
      // success so fire-and-forget callers stay quiet.
      return NextResponse.json({ success: true, message: 'Tracked', data: null, error: null });
    }

    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ success: true, message: 'Tracked', data: null, error: null });
  }
}
