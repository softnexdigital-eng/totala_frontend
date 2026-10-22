/**
 * Helpers for the `doctor` session cookie.
 *
 * WHY THIS EXISTS:
 * The API's `serializeDoctor()` returns EVERY doctor column, including huge
 * fields such as `profileImage` (a base64 data-URL that can be 70KB+ once a
 * photo is uploaded through the registration form).
 *
 * Browsers silently DROP any single cookie larger than ~4096 bytes — no error,
 * the write is simply ignored. Because the server layout and the client
 * dashboard layout both read this cookie, an oversized value made
 * /doctor-dashboard bounce straight back to /doctor-login even though the
 * login API had returned "লগিন সফল".
 *
 * So we whitelist only the small fields the UI actually renders and keep a
 * hard byte budget as a safety net.
 */

export interface DoctorSession {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  mobileNumber?: string | null;
  title?: string | null;
  specialization?: string | null;
  degree?: string | null;
  bmdcRegNo?: string | null;
  registrationStatus?: string | null;
  isVerified?: boolean;
  fee?: number | null;
  hospital?: string | null;
}

/** Cookies over ~4096 bytes are dropped silently by every major browser. */
const MAX_COOKIE_BYTES = 4000;

/** Absolute minimum kept when even the slim profile exceeds the budget. */
const FALLBACK_FIELDS: (keyof DoctorSession)[] = [
  'id',
  'name',
  'email',
  'registrationStatus',
  'isVerified',
];

type AnyDoctor = object | null | undefined;

const pick = (doctor: AnyDoctor): DoctorSession => {
  const source = (doctor ?? {}) as Record<string, unknown>;
  const value = (key: string): unknown => source[key];

  return {
    id: String(value('id') ?? ''),
    name: (value('name') as string) ?? '',
    email: (value('email') as string) ?? null,
    phone: (value('phone') as string) ?? null,
    mobileNumber: (value('mobileNumber') as string) ?? null,
    title: (value('title') as string) ?? null,
    specialization: (value('specialization') as string) ?? null,
    degree: (value('degree') as string) ?? null,
    bmdcRegNo: (value('bmdcRegNo') as string) ?? null,
    registrationStatus: (value('registrationStatus') as string) ?? null,
    isVerified: (value('isVerified') as boolean) ?? false,
    fee: (value('fee') as number) ?? null,
    hospital: (value('hospital') as string) ?? null,
  };
};

/**
 * Returns the value to store in `document.cookie` for `doctor=...`.
 * Always stays well below the browser's per-cookie size limit.
 */
export function serializeDoctorCookie(
  doctor: AnyDoctor | null | undefined
): string {
  const session = pick(doctor);
  let encoded = encodeURIComponent(JSON.stringify(session));

  if (encoded.length > MAX_COOKIE_BYTES) {
    const minimal: Record<string, unknown> = {};
    FALLBACK_FIELDS.forEach((key) => {
      minimal[key] = session[key];
    });
    encoded = encodeURIComponent(JSON.stringify(minimal));
  }

  return encoded;
}

/**
 * Reads + parses the `doctor` cookie on the client. Returns `null` when the
 * cookie is absent, malformed, or not a doctor object (e.g. a legacy value).
 */
export function readDoctorCookie(): DoctorSession | null {
  if (typeof document === 'undefined') return null;

  const row = document.cookie
    .split('; ')
    .find((part) => part.startsWith('doctor='));
  if (!row) return null;

  try {
    const parsed = JSON.parse(
      decodeURIComponent(row.slice('doctor='.length))
    ) as DoctorSession;
    if (!parsed || typeof parsed !== 'object' || !parsed.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
