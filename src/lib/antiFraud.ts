/**
 * Public anti-fraud helpers shared by the booking forms (BookNowModal and the
 * standalone /bookings/new page).
 *
 * Everything here calls same-origin `/api/public/*` Next.js routes (required
 * by CSP `connect-src 'self'`), which forward to the Express backend while
 * re-attaching the visitor's IP/device headers.
 */

/** Stable per-browser id kept in localStorage; sent as `fingerprint`. */
export function getFingerprint(): string {
  if (typeof window === 'undefined') return '';
  try {
    let fp = window.localStorage.getItem('td_fingerprint');
    if (!fp) {
      fp =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      window.localStorage.setItem('td_fingerprint', fp);
    }
    return fp;
  } catch {
    // Storage blocked (private mode) — degrade to an empty value; the backend
    // falls back to IP-based tracking.
    return '';
  }
}

/** Single-use idempotency key so double-click / retry submits collapse into one booking. */
export function newIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `idem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

export interface TrackLeadPayload {
  email?: string;
  phone?: string;
  name?: string;
  fieldName: string;
  formStage?: string;
}

/**
 * Half-form / drop-off tracker. Fire-and-forget: booking UX must never wait
 * on (or break because of) analytics. Errors are swallowed on purpose.
 */
export function trackLead(payload: TrackLeadPayload): void {
  if (typeof window === 'undefined') return;
  try {
    fetch('/api/public/track-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        pageUrl: window.location.href,
        fingerprint: getFingerprint(),
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // never block the form
  }
}
