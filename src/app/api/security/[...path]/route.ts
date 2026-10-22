/**
 * Authenticated catch-all proxy for the backend security endpoints.
 *
 *   GET    /api/security/overview      | visit-stats | site-visits
 *          | visitors | leads | blocked
 *   POST   /api/security/block
 *   DELETE /api/security/blocked/:ip   (by IP string)
 *   DELETE /api/security/blocked-id/:id (by BlockedIp row id — exact match)
 *
 * The by-id route exists because the backend deletes BlockedIp by `ip`
 * string, but stored vs lookup representations often differ
 * (`::1` vs `::ffff:127.0.0.1` vs `127.0.0.1`) -> Prisma
 * "Record to delete does not exist" (500). Deleting by id is exact.
 * The by-id handler fans out to DELETE-by-ip with every known
 * representation of the row's ip, so no backend change is needed.
 *
 * Follows the same pattern as the other dashboard proxies: the admin/agent
 * session cookie is exchanged for the backend Bearer token via getAuthToken().
 * `src/middleware.ts` already requires a session for every `/api/*` path that
 * is not explicitly public, so this route is unreachable without a login.
 */
import { NextResponse } from 'next/server';
import { getAuthToken } from '@/lib/serverAuth';
import { backendJson } from '@/lib/serverProxy';

const BACKEND = process.env.BACKEND_URL || 'http://localhost:5000';

type Ctx = { params: { path: string[] } };

function targetUrl(req: Request, ctx: Ctx): string {
  const path = ctx.params.path.map(encodeURIComponent).join('/');
  const query = new URL(req.url).search;
  return `${BACKEND}/api/security/${path}${query}`;
}

async function proxy(req: Request, ctx: Ctx, method: 'GET' | 'POST' | 'DELETE') {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', data: null, error: null },
        { status: 401 }
      );
    }

    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    let body: string | undefined;
    if (method === 'POST') {
      body = await req.text();
      headers['Content-Type'] = 'application/json';
    }

    const result = await backendJson(targetUrl(req, ctx), { method, headers, body });

    if (!result.ok) {
      // Surface the backend's real message so "Unblock failed" is debuggable:
      // status 0 = backend unreachable (wrong BACKEND_URL / backend down),
      // 404 = backend route mismatch, 401/403 = token lacks admin rights.
      const detail =
        result.data?.message ||
        result.data?.error ||
        (result.status === 0
          ? `Could not reach the security service at ${BACKEND} — check BACKEND_URL / backend status`
          : result.status === 404
            ? `Backend route not found: DELETE /api/security/${ctx.params.path.join('/')} — backend version mismatch`
            : `Request failed (backend status ${result.status})`);
      return NextResponse.json(
        {
          success: false,
          message: detail,
          data: null,
          error: result.data?.error || null,
          backendStatus: result.status,
        },
        { status: result.status || 502 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error', data: null, error: null },
      { status: 500 }
    );
  }
}

export async function GET(req: Request, ctx: Ctx) {
  return proxy(req, ctx, 'GET');
}

export async function POST(req: Request, ctx: Ctx) {
  return proxy(req, ctx, 'POST');
}

export async function DELETE(req: Request, ctx: Ctx) {
  // By-id unblock: GET the blocked list, find the row, then DELETE by ip
  // trying every representation (raw, ::ffff: mapped, plain v4). The backend
  // only supports delete-by-ip, and ::1 vs 127.0.0.1 mismatch is what causes
  // Prisma "Record to delete does not exist" (500).
  if (ctx.params.path[0] === 'blocked-id' && ctx.params.path[1]) {
    return unblockById(req, ctx.params.path[1]);
  }
  return proxy(req, ctx, 'DELETE');
}

/** Expand one IP into every representation the backend might have stored. */
function ipVariants(ip: string): string[] {
  const out = [ip];
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (v4 !== ip) out.push(v4);
  if (v4 === '127.0.0.1') out.push('::1', '::ffff:127.0.0.1');
  if (ip === '::1') out.push('127.0.0.1', '::ffff:127.0.0.1');
  // Array.from (not spread) — the project compiles with target ES5.
  return Array.from(new Set(out));
}

async function unblockById(req: Request, id: string) {
  try {
    const token = await getAuthToken();
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized', data: null, error: null },
        { status: 401 }
      );
    }
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

    // 1. Find the row's ip from the blocked list.
    const list = await backendJson(`${BACKEND}/api/security/blocked`, { headers });
    const rows: any[] = Array.isArray(list.data?.data)
      ? list.data.data
      : Array.isArray(list.data)
        ? list.data
        : [];
    const row = rows.find((r) => String(r?.id) === String(id));
    if (!row) {
      // Already gone server-side — treat as success so the UI row disappears.
      return NextResponse.json({ success: true, message: 'IP already unblocked', data: null });
    }
    const ip = String(row.ip || '').trim();
    if (!ip) {
      return NextResponse.json(
        { success: false, message: 'Blocked row has no IP', data: null, error: null },
        { status: 422 }
      );
    }

    // 2. DELETE by ip, trying every representation until one works.
    let last: { ok: boolean; status: number; data: any } = { ok: false, status: 500, data: null };
    for (const variant of ipVariants(ip)) {
      last = await backendJson(`${BACKEND}/api/security/blocked/${encodeURIComponent(variant)}`, {
        method: 'DELETE',
        headers,
      });
      if (last.ok) return NextResponse.json(last.data);
      const err = String(last.data?.error || last.data?.message || '');
      const isMissing = /not found|does not exist|no.*record|not exist/i.test(err);
      if (!isMissing) break; // real error (auth etc.) — don't keep trying
    }
    return NextResponse.json(
      {
        success: false,
        message: last.data?.message || 'Unblock failed',
        data: null,
        error: last.data?.error || null,
        backendStatus: last.status,
      },
      { status: last.status || 502 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error', data: null, error: null },
      { status: 500 }
    );
  }
}
