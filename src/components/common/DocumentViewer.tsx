'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Shared document viewer for task documents (doctor prescription / test invoice)
 * used by the super-admin task tables and the patients table.
 *
 * UX (as required):
 * - Small thumbnail(s) are rendered inside the data-table row. For multiple
 *   images the first N thumbnails are shown with a "+N" overflow badge.
 * - HOVER on an image thumbnail (deliberate ~600ms, fine pointers only) opens
 *   the enlarged modal automatically.
 * - CLICK opens the same modal persistently (closed via ✕ / Esc / backdrop).
 * - Multiple images: modal acts as a gallery — big preview + thumbnail strip,
 *   prev/next arrows, "2 / 5" counter and keyboard navigation (← / → / Esc).
 * - Non-image files (PDF/doc) render a file badge and open in a new tab.
 */

export interface DocumentFile {
  url: string;
  label?: string;
}

/** Absolute (Cloudinary) vs relative (/uploads/...) URL resolution. */
export function resolveFileUrl(url?: string | null): string {
  if (!url) return '';
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
  return `${base.replace(/\/$/, '')}${url.startsWith('/') ? url : `/${url}`}`;
}

export function isImageFile(url?: string | null): boolean {
  if (!url) return false;
  if (/^data:image\//i.test(url)) return true;
  return /\.(jpe?g|png|webp|gif|bmp|avif|svg)(\?|#|$)/i.test(url);
}

export function isPdfFile(url?: string | null): boolean {
  return !!url && /\.pdf(\?|#|$)/i.test(url);
}

interface DocumentLightboxProps {
  files: DocumentFile[];
  index: number;
  title: string;
  /** true → opened by hover: closes when the pointer leaves the modal card. */
  hoverMode?: boolean;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

function DocumentLightbox({
  files,
  index,
  title,
  hoverMode,
  onIndexChange,
  onClose,
}: DocumentLightboxProps) {
  const current = files[index];
  const url = resolveFileUrl(current?.url);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (files.length <= 1) return;
      if (e.key === 'ArrowRight') onIndexChange((index + 1) % files.length);
      if (e.key === 'ArrowLeft') onIndexChange((index - 1 + files.length) % files.length);
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, files.length, onClose, onIndexChange]);

  const go = (dir: -1 | 1) => {
    if (files.length <= 1) return;
    onIndexChange((index + dir + files.length) % files.length);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onMouseLeave={() => {
          // Hover-opened preview follows the pointer: leave closes it.
          if (hoverMode) onClose();
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {current?.label ? `${current.label} · ${title}` : title}
            </p>
            {files.length > 1 && (
              <p className="text-[11px] text-slate-500">
                {index + 1} / {files.length} — use ← → or the thumbnails below
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={url || undefined}
              target="_blank"
              rel="noreferrer"
              className="rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
            >
              Open original
            </a>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded p-1 text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Preview area */}
        <div className="relative flex min-h-[160px] flex-1 items-center justify-center bg-slate-900">
          {isImageFile(current?.url) ? (
            <img
              src={url}
              alt={current?.label || title}
              className="max-h-[65vh] max-w-full object-contain"
            />
          ) : isPdfFile(current?.url) ? (
            <iframe src={url} title={current?.label || title} className="h-[65vh] w-full bg-white" />
          ) : (
            <a
              href={url || undefined}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-white px-5 py-4 text-sm font-medium text-blue-700 underline"
            >
              Open file in new tab
            </a>
          )}

          {files.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous"
                className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next"
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/75"
              >
                ›
              </button>
            </>
          )}
        </div>
        {/* Thumbnail strip for multi-image documents */}
        {files.length > 1 && (
          <div className="flex items-center justify-center gap-2 overflow-x-auto border-t border-slate-200 bg-white px-3 py-2">
            {files.map((file, i) => (
              <button
                key={`${file.url}-${i}`}
                type="button"
                onClick={() => onIndexChange(i)}
                title={file.label || `Image ${i + 1}`}
                className={`h-14 w-14 shrink-0 overflow-hidden rounded border-2 transition ${
                  i === index
                    ? 'border-blue-500 opacity-100 ring-2 ring-blue-200'
                    : 'border-slate-200 opacity-60 hover:opacity-100'
                }`}
              >
                {isImageFile(file.url) ? (
                  <img
                    src={resolveFileUrl(file.url)}
                    alt={file.label || `Image ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-slate-100 text-[9px] font-semibold uppercase text-slate-500">
                    {isPdfFile(file.url) ? 'PDF' : 'File'}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DocumentGroupProps {
  files: DocumentFile[];
  /** Modal heading, e.g. "Doctor Prescription". */
  title: string;
  emptyText?: string;
  /** How many thumbnails stay visible in the table cell before collapsing into "+N". */
  maxVisible?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function DocumentGroup({
  files,
  title,
  emptyText = '—',
  maxVisible = 3,
  size = 'sm',
  className = '',
}: DocumentGroupProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [hoverMode, setHoverMode] = useState(false);
  const hoverTimer = useRef<number | null>(null);
  const canHover = useRef(false);

  useEffect(() => {
    canHover.current =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    return () => {
      if (hoverTimer.current) window.clearTimeout(hoverTimer.current);
    };
  }, []);

  const clearHoverTimer = () => {
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  };

  if (!files || files.length === 0) {
    return <span className="text-xs text-slate-400">{emptyText}</span>;
  }

  const visible = files.slice(0, maxVisible);
  const overflow = files.length - visible.length;
  const thumbCls = size === 'sm' ? 'h-11 w-11' : 'h-16 w-16';

  const openAt = (i: number, byHover: boolean) => {
    clearHoverTimer();
    setHoverMode(byHover);
    setOpenIndex(i);
  };

  const handleEnter = (i: number, el: HTMLElement, file: DocumentFile) => {
    if (!canHover.current || openIndex !== null) return;
    // Hover-preview only makes sense for actual images; PDFs need an explicit click.
    if (!isImageFile(file.url)) return;
    void el;
    clearHoverTimer();
    // Deliberate hover (600ms) before the enlarged modal opens, so scanning
    // across the table does not pop modals unintentionally.
    hoverTimer.current = window.setTimeout(() => openAt(i, true), 600);
  };

  const handleLeave = () => clearHoverTimer();

  return (
    <>
      <div className={`flex flex-wrap items-start gap-1.5 ${className}`}>
        {visible.map((file, i) => {
          const showCount = i === visible.length - 1 && overflow > 0;
          return (
            <div key={`${file.url}-${i}`} className="flex flex-col items-center gap-0.5">
              <button
                type="button"
                onClick={() => openAt(i, false)}
                onMouseEnter={(e) => handleEnter(i, e.currentTarget, file)}
                onMouseLeave={handleLeave}
                title={`${file.label || title}${files.length > 1 ? ` (${i + 1}/${files.length})` : ''} — hover or click to enlarge`}
                className={`relative block overflow-hidden rounded-md border border-slate-300 bg-slate-100 transition hover:border-blue-400 hover:shadow ${thumbCls}`}
              >
                {isImageFile(file.url) ? (
                  <img
                    src={resolveFileUrl(file.url)}
                    alt={file.label || title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[9px] font-semibold uppercase text-slate-500">
                    {isPdfFile(file.url) ? 'PDF' : 'File'}
                  </span>
                )}
                {showCount && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 text-center text-[9px] font-semibold text-white">
                    +{overflow}
                  </span>
                )}
              </button>
              {file.label && (
                <span className="max-w-[48px] truncate text-[9px] leading-tight text-slate-500">
                  {file.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {openIndex !== null && (
        <DocumentLightbox
          files={files}
          index={openIndex}
          title={title}
          hoverMode={hoverMode}
          onIndexChange={(i) => setOpenIndex(i)}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}


