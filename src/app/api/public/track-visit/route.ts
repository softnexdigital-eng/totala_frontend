/**
 * Public (no-auth) proxy for the site-wide page-view beacon.
 *
 *   POST /api/public/track-visit  { pageUrl?, page?, fingerprint? }
 *
 * The root layout fires this once per route change (fire-and-forget) so the
 * admin "Security" dashboard can count visits, unique IPs and top pages.
 * Backend de-dupes identical ip+fingerprint+page hits within 30s.
 */
import { NextResponse } from 'next/server';
import { backendJson, forwardClientHeaders, readJsonBody } from '@/lib/serverProxy';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

export async function POST(req: Request) {
  try {
    const body = await readJsonBody(req);

    const result = await backendJson(`${BACKEND}/api/security/track-visit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardClientHeaders(req),
      },
      body: JSON.stringify(body),
    });

    // The beacon is analytics: never fail loudly, regardless of backend state.
    return NextResponse.json({ success: true, message: 'Visit tracked', data: null, error: null });
  } catch {
    return NextResponse.json({ success: true, message: 'Visit tracked', data: null, error: null });
  }
}
