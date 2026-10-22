'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

/* ---------------------------------------------------------------- types -- */

interface Overview {
  visits24h: number;
  blockedIps: number;
  dropOffLeads24h: number;
  otpRequests24h: number;
  siteVisitsToday: number;
  siteVisitsTotal: number;
}

interface VisitStats {
  today: number;
  todayUniqueIp: number;
  todayUniqueDevice: number;
  last7days: number;
  total: number;
  topPagesToday: { page: string; views: number }[];
}

interface SiteVisit {
  id: string;
  ip: string;
  fingerprint?: string | null;
  page?: string | null;
  pageUrl?: string | null;
  city?: string | null;
  country?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

interface VisitorLog {
  id: string;
  ip: string;
  email?: string | null;
  phone?: string | null;
  path?: string | null;
  city?: string | null;
  country?: string | null;
  fraudScore: number;
  status: string;
  createdAt: string;
}

interface LeadTrack {
  id: string;
  ip?: string | null;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  fieldName?: string | null;
  formStage: string;
  pageUrl?: string | null;
  createdAt: string;
}

interface BlockedIp {
  id: string;
  ip: string;
  reason?: string | null;
  blockedTill?: string | null;
  permanent: boolean;
  createdAt: string;
}

type TabKey = 'overview' | 'site-visits' | 'visitors' | 'leads' | 'blocked';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'site-visits', label: 'Site Visits' },
  { key: 'visitors', label: 'Visitor Logs' },
  { key: 'leads', label: 'Drop-off Leads' },
  { key: 'blocked', label: 'Blocked IPs' },
];

/* ------------------------------------------------------------ component -- */

interface SecurityClientProps {
  initialOverview: Overview | null;
  initialStats: VisitStats | null;
}

export default function SecurityClient({ initialOverview, initialStats }: SecurityClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [overview, setOverview] = useState<Overview | null>(initialOverview);
  const [stats, setStats] = useState<VisitStats | null>(initialStats);

  const [siteVisits, setSiteVisits] = useState<SiteVisit[]>([]);
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [leads, setLeads] = useState<LeadTrack[]>([]);
  const [blocked, setBlocked] = useState<BlockedIp[]>([]);

  const [loading, setLoading] = useState(false);
  const [blockIpValue, setBlockIpValue] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  const fetchJson = useCallback(async (path: string) => {
    const res = await fetch(path, { cache: 'no-store' });
    const data = await res.json().catch(() => null);
    return data?.success ? data.data : null;
  }, []);

  const loadTab = useCallback(
    async (tab: TabKey) => {
      setLoading(true);
      try {
        switch (tab) {
          case 'overview': {
            const [ov, st] = await Promise.all([
              fetchJson('/api/security/overview'),
              fetchJson('/api/security/visit-stats'),
            ]);
            if (ov) setOverview(ov);
            if (st) setStats(st);
            break;
          }
          case 'site-visits': {
            const rows = await fetchJson('/api/security/site-visits?limit=100');
            setSiteVisits(rows || []);
            break;
          }
          case 'visitors': {
            const rows = await fetchJson('/api/security/visitors?limit=100');
            setVisitors(rows || []);
            break;
          }
          case 'leads': {
            const rows = await fetchJson('/api/security/leads?limit=100');
            setLeads(rows || []);
            break;
          }
          case 'blocked': {
            const rows = await fetchJson('/api/security/blocked');
            setBlocked(rows || []);
            break;
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchJson]
  );

  useEffect(() => {
    loadTab(activeTab);
  }, [activeTab, loadTab]);

  const handleBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const ip = blockIpValue.trim();
    if (!ip) {
      toast.error('Enter an IP to block');
      return;
    }
    setBlocking(true);
    try {
      const res = await fetch('/api/security/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, reason: blockReason || 'Manual block by admin', days: 7 }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'IP blocked');
        setBlockIpValue('');
        setBlockReason('');
        loadTab('blocked');
      } else {
        toast.error(data.message || 'Failed to block IP');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblock = async (ip: string, id?: string) => {
    const clean = ip.trim();
    if (!clean) return;
    if (!confirm(`Unblock ${clean}? Visitors from this IP will be allowed again.`)) return;
    // NOTE: `clean` here is the RAW ip from the blocked-list row (e.g. `::1`).
    // NEVER pre-encode it — fetch() + the [...path] proxy encode each segment
    // exactly once. Double-encoding (`%3A%3A1`) is what caused the backend
    // Prisma "Record to delete does not exist" (500).
    // Backend quirk workaround: backend deletes BlockedIp by `ip` string, but
    // stored vs lookup representations often differ (`::1` vs
    // `::ffff:127.0.0.1` vs `127.0.0.1`). So: try by id first (the proxy
    // fans out to every representation), fall back to by-ip.
    const attempts = [
      ...(id ? [`/api/security/blocked-id/${id}`] : []),
      `/api/security/blocked/${clean}`,
    ];
    try {
      let lastData: any = null;
      let lastStatus = 0;
      for (const url of attempts) {
        const res = await fetch(url, { method: 'DELETE' });
        const data = await res.json().catch(() => null);
        lastData = data;
        lastStatus = res.status;
        if (res.ok && data?.success) {
          toast.success(data.message || 'IP unblocked');
          setBlocked((prev) => prev.filter((row) => (id ? row.id !== id : row.ip !== clean)));
          setOverview((prev) =>
            prev ? { ...prev, blockedIps: Math.max(0, prev.blockedIps - 1) } : prev
          );
          return;
        }
        // "Record to delete does not exist" -> try the next attempt.
        const err = String(data?.error || data?.message || '');
        const isMissing =
          res.status === 404 || res.status === 500
            ? /not found|does not exist|no.*record|not exist/i.test(err)
            : false;
        if (!isMissing) break;
      }
      const raw = String(lastData?.error || '');
      const why =
        raw && !/prisma|invocation/i.test(raw)
          ? raw
          : lastData?.message || `Failed to unblock IP (HTTP ${lastStatus})`;
      toast.error(why, { duration: 6000 });
      // Refresh the list so a stale row (already deleted server-side) disappears.
      loadTab('blocked');
    } catch {
      toast.error('Something went wrong');
    }
  };

  const formatDate = (value?: string | null) =>
    value
      ? new Date(value).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '—';

  /* ------------------------------------------------------------- render -- */

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-sm text-gray-500">Loading…</div>}

      {/* ---------------- Overview ---------------- */}
      {activeTab === 'overview' && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard label="Visits (24h)" value={overview?.visits24h ?? 0} />
            <StatCard label="Site Visits Today" value={overview?.siteVisitsToday ?? 0} />
            <StatCard label="Unique IPs Today" value={stats?.todayUniqueIp ?? 0} />
            <StatCard label="Drop-off Leads (24h)" value={overview?.dropOffLeads24h ?? 0} />
            <StatCard label="OTP Requests (24h)" value={overview?.otpRequests24h ?? 0} />
            <StatCard label="Blocked IPs" value={overview?.blockedIps ?? 0} accent="text-red-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Visit Totals</h3>
              <dl className="space-y-2 text-sm">
                <Row label="Today" value={stats?.today ?? 0} />
                <Row label="Unique devices today" value={stats?.todayUniqueDevice ?? 0} />
                <Row label="Last 7 days" value={stats?.last7days ?? 0} />
                <Row label="All time" value={stats?.total ?? 0} />
              </dl>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Top Pages Today</h3>
              {stats?.topPagesToday?.length ? (
                <ul className="space-y-2 text-sm">
                  {stats.topPagesToday.map((p) => (
                    <li key={p.page} className="flex justify-between">
                      <span className="text-gray-700 truncate mr-2">{p.page}</span>
                      <span className="font-medium">{p.views}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No visits recorded yet today</p>
              )}
            </div>
          </div>

          {/* Quick block form */}
          <form onSubmit={handleBlock} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Block an IP</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={blockIpValue}
                onChange={(e) => setBlockIpValue(e.target.value)}
                placeholder="e.g. 203.0.113.45"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <input
                type="text"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Reason (optional)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={blocking}
                className="px-6 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition disabled:opacity-60"
              >
                {blocking ? 'Blocking…' : 'Block 7 days'}
              </button>
            </div>
          </form>
        </div>
      )}


      {/* ---------------- Site Visits ---------------- */}
      {activeTab === 'site-visits' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {siteVisits.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No site visits recorded</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Time</Th>
                    <Th>Page</Th>
                    <Th>IP</Th>
                    <Th>Location</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {siteVisits.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <Td>{formatDate(row.createdAt)}</Td>
                      <Td>{row.page || row.pageUrl || '—'}</Td>
                      <Td className="font-mono text-xs">{row.ip}</Td>
                      <Td>{[row.city, row.country].filter(Boolean).join(', ') || '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- Visitor Logs ---------------- */}
      {activeTab === 'visitors' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {visitors.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No visitor logs yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Time</Th>
                    <Th>IP</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Path</Th>
                    <Th>Location</Th>
                    <Th>Fraud</Th>
                    <Th>Status</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visitors.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <Td>{formatDate(row.createdAt)}</Td>
                      <Td className="font-mono text-xs">{row.ip}</Td>
                      <Td>{row.email || '—'}</Td>
                      <Td>{row.phone || '—'}</Td>
                      <Td className="max-w-[160px] truncate">{row.path || '—'}</Td>
                      <Td>{[row.city, row.country].filter(Boolean).join(', ') || '—'}</Td>
                      <Td>
                        <span
                          className={
                            row.fraudScore >= 50
                              ? 'font-semibold text-red-600'
                              : row.fraudScore > 0
                              ? 'text-orange-600'
                              : 'text-gray-500'
                          }
                        >
                          {row.fraudScore}
                        </span>
                      </Td>
                      <Td>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            row.status === 'BLOCKED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => handleUnblock(row.ip, (row as any).id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Unblock IP
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}


      {/* ---------------- Drop-off Leads ---------------- */}
      {activeTab === 'leads' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No drop-off leads recorded</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Time</Th>
                    <Th>Name</Th>
                    <Th>Email</Th>
                    <Th>Phone</Th>
                    <Th>Last Field</Th>
                    <Th>Stage</Th>
                    <Th>IP</Th>
                    <Th>Page</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {leads.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <Td>{formatDate(row.createdAt)}</Td>
                      <Td>{row.name || '—'}</Td>
                      <Td>{row.email || '—'}</Td>
                      <Td>{row.phone || '—'}</Td>
                      <Td>{row.fieldName || '—'}</Td>
                      <Td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {row.formStage}
                        </span>
                      </Td>
                      <Td className="font-mono text-xs">{row.ip || '—'}</Td>
                      <Td className="max-w-[180px] truncate">{row.pageUrl || '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------- Blocked IPs ---------------- */}
      {activeTab === 'blocked' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {blocked.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No blocked IPs</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>IP</Th>
                    <Th>Reason</Th>
                    <Th>Blocked Till</Th>
                    <Th>Created</Th>
                    <Th>Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {blocked.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <Td className="font-mono text-xs">{row.ip}</Td>
                      <Td>{row.reason || '—'}</Td>
                      <Td>{row.permanent ? 'Permanent' : formatDate(row.blockedTill)}</Td>
                      <Td>{formatDate(row.createdAt)}</Td>
                      <Td>
                        <button
                          type="button"
                          onClick={() => handleUnblock(row.ip, row.id)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Unblock
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- pieces -- */

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-600">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
      {children}
    </th>
  );
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 ${className}`}>{children}</td>;
}

