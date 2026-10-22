/**
 * Server-side proxy helpers for forwarding browser requests to the Express
 * backend (BACKEND_URL).
 *
 * Why this exists: the browser may only talk to same-origin `/api/*` routes
 * (CSP `connect-src 'self'`), so every backend call goes through a Next.js
 * route handler. The backend does per-IP rate limiting, geo lookup and IP
 * blocking — but a server-to-server fetch would otherwise present the Next.js
 * server's IP as the client. `forwardClientHeaders` re-attaches the original
 * visitor's IP + device headers so those protections keep working.
 */

type JsonProxyResult = { ok: boolean; status: number; data: any };

/**
 * Safe backend JSON fetch that never throws.
 *
 * Returns the parsed body for successful *and* failed JSON responses so the
 * caller can forward the real backend error message. `data` is `null` for
 * non-JSON bodies (e.g. an HTML error page) and for unreachable backends, where
 * `status` is reported as `0`.
 */
export async function backendJson(
  input: string,
  init?: RequestInit
): Promise<JsonProxyResult> {
  try {
    const res = await fetch(input, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.headers as Record<string, string> | undefined),
      },
      cache: 'no-store',
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return { ok: false, status: res.status, data: null };
    }
    const data = await res.json().catch(() => null);
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

/**
 * Copy the visitor identity headers from an incoming browser request so the
 * backend sees the real client instead of the Next.js server:
 *  - x-forwarded-for / x-real-ip / cf-connecting-ip  (per-IP rate limit + block)
 *  - user-agent, x-fingerprint                       (visitor log / geo)
 *
 * NOTE: like the existing frontend middleware, x-forwarded-for is trusted as
 * provided by the hosting proxy (Netlify/Vercel append the real client IP).
 */
export function forwardClientHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  const copy = (name: string) => {
    const value = req.headers.get(name);
    if (value) headers[name] = value;
  };
  copy('x-forwarded-for');
  copy('x-real-ip');
  copy('cf-connecting-ip');
  copy('x-fingerprint');
  copy('user-agent');
  return headers;
}

/**
 * Parse an incoming JSON body without throwing. Returns `{}` for empty or
 * malformed bodies so downstream validation produces a clean 400/401.
 */
export async function readJsonBody(req: Request): Promise<Record<string, any>> {
  try {
    const body = await req.json();
    return body && typeof body === 'object' ? body : {};
  } catch {
    return {};
  }
}
