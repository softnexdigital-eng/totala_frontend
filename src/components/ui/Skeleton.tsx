// Reusable skeleton loaders for the DakDin landing page.

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-slate-200/80 ${className}`}
    />
  );
}

/** Skeleton for the "Our Agents" cards. */
export function AgentCardSkeleton() {
  return (
    <div
      role="status"
      aria-label="লোড হচ্ছে"
      className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
      </div>
      <Skeleton className="mt-5 h-9 w-full rounded-xl" />
    </div>
  );
}

/** Skeleton rows for the search-bar service dropdown. */
export function DropdownSkeleton() {
  return (
    <div role="status" aria-label="লোড হচ্ছে" className="space-y-1 p-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a service card (used by the full-page skeleton). */
export function ServiceCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5">
      <Skeleton className="h-12 w-12 rounded-full" />
      <Skeleton className="mt-4 h-4 w-3/4" />
      <Skeleton className="mt-2.5 h-3 w-full" />
      <Skeleton className="mt-1.5 h-3 w-2/3" />
    </div>
  );
}

/** Full-page skeleton — used by app/loading.tsx while the route streams in. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="লোড হচ্ছে" className="min-h-screen bg-white">
      {/* navbar */}
      <div className="flex h-[84px] items-center justify-between border-b border-slate-100 px-5 lg:px-10">
        <Skeleton className="h-14 w-44" />
        <div className="hidden gap-6 lg:flex">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        <Skeleton className="h-11 w-40 rounded-full" />
      </div>

      {/* hero */}
      <div className="bg-gradient-to-r from-emerald-50 to-white px-5 py-14 lg:px-10">
        <div className="mx-auto max-w-7.5xl space-y-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-72 max-w-full" />
          <Skeleton className="h-12 w-56 max-w-full" />
          <Skeleton className="h-4 w-80 max-w-full" />
          <Skeleton className="mt-6 h-14 w-full max-w-xl rounded-full" />
        </div>
      </div>

      {/* services */}
      <div className="mx-auto max-w-7.5xl px-5 py-10 lg:px-10">
        <Skeleton className="mb-6 h-6 w-48" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <ServiceCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
