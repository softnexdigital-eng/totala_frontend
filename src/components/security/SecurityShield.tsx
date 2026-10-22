'use client';

// src/components/security/SecurityShield.tsx
//
// Browser-side deterrents. They only run in production builds.
// IMPORTANT: these make casual inspecting harder, but they can NEVER fully
// stop a determined person — anything sent to a browser can be read. Real
// security lives on the server (auth checks, validation, rate limits, headers).

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

const DEVTOOLS_GAP = 170; // px difference between outer/inner window size

export default function SecurityShield() {
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;

    // 1) Anti-clickjacking: refuse to run inside someone else's iframe.
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = window.self.location.href;
      }
    } catch {
      document.documentElement.style.display = 'none';
    }

    // 2) Block context menu, drag, and copy outside form fields.
    const isEditable = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    };
    const blockAlways = (e: Event) => e.preventDefault();
    const blockOutsideInputs = (e: Event) => {
      if (!isEditable(e.target)) e.preventDefault();
    };

    // 3) Block common inspect / view-source / save shortcuts.
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const blocked =
        e.key === 'F12' ||
        (ctrl && e.shiftKey && ['i', 'j', 'c', 'k'].includes(k)) ||
        (ctrl && ['u', 's'].includes(k)) ||
        (e.metaKey && e.altKey && ['i', 'j', 'c', 'u', 's'].includes(k));
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // 4) Detect docked DevTools by window-size gap (desktop only).
    const isDesktop = window.matchMedia('(pointer: fine)').matches;
    const check = () => {
      if (!isDesktop) return;
      const widthGap = window.outerWidth - window.innerWidth > DEVTOOLS_GAP;
      const heightGap = window.outerHeight - window.innerHeight > DEVTOOLS_GAP;
      setDevtoolsOpen(widthGap || heightGap);
    };
    check();
    const interval = window.setInterval(check, 1000);
    window.addEventListener('resize', check);

    // 5) Disable text selection / image dragging outside inputs.
    const style = document.createElement('style');
    style.setAttribute('data-shield', '1');
    style.textContent = `
      body { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
      input, textarea, [contenteditable="true"] { -webkit-user-select: text; user-select: text; }
      img { -webkit-user-drag: none; user-drag: none; }
    `;
    document.head.appendChild(style);

    document.addEventListener('contextmenu', blockAlways);
    document.addEventListener('dragstart', blockAlways);
    document.addEventListener('copy', blockOutsideInputs);
    document.addEventListener('cut', blockOutsideInputs);
    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', check);
      document.removeEventListener('contextmenu', blockAlways);
      document.removeEventListener('dragstart', blockAlways);
      document.removeEventListener('copy', blockOutsideInputs);
      document.removeEventListener('cut', blockOutsideInputs);
      document.removeEventListener('keydown', onKeyDown, true);
      style.remove();
    };
  }, []);

  if (!devtoolsOpen) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-white p-6 text-center"
    >
      <div className="max-w-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-black text-slate-900">
          নিরাপত্তার কারণে পেজটি লক করা হয়েছে
        </h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          ডেভেলপার টুলস চালু থাকা অবস্থায় এই পেজটি ব্যবহার করা যাবে না। অনুগ্রহ করে
          টুলস বন্ধ করে পেজটি ব্যবহার করুন।
        </p>
      </div>
    </div>
  );
}
