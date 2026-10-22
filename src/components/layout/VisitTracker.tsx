'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { getFingerprint } from '@/lib/antiFraud';

/**
 * Site-wide page-view beacon (fire-and-forget).
 *
 * Fires POST /api/public/track-visit once per route change so the admin
 * "Security" dashboard can count visits, unique IPs/devices and top pages.
 * The backend de-dupes identical ip+fingerprint+page hits within 30s, and all
 * errors are swallowed — tracking must never affect UX.
 */
export default function VisitTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    // React StrictMode double-invokes effects in dev — avoid double posts.
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;

    try {
      fetch('/api/public/track-visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageUrl: window.location.href,
          page: pathname,
          fingerprint: getFingerprint(),
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // analytics must never throw into the UI
    }
  }, [pathname]);

  return null;
}
