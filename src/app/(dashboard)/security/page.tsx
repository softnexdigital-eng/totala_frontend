import { fetchBackendJson } from '../../../lib/api';
import { getAuthToken } from '@/lib/serverAuth';
import SecurityClient from './security-client';

/**
 * Security & Fraud Shield dashboard.
 *
 * Server-fetches the two summary payloads (overview + visit stats) so the
 * first paint already shows numbers; the interactive lists (site visits,
 * visitors, leads, blocked IPs) are fetched client-side by SecurityClient via
 * the authenticated `/api/security/*` proxy.
 */
async function getInitialData() {
  const token = await getAuthToken();
  const [overview, stats] = await Promise.all([
    fetchBackendJson('/api/security/overview', token),
    fetchBackendJson('/api/security/visit-stats', token),
  ]);
  return { overview, stats };
}

export default async function SecurityPage() {
  const { overview, stats } = await getInitialData();

  if (!overview) {
    return <div>Please login</div>;
  }

  return (
    <div className="p-6 max-w-7.5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Security &amp; Fraud Shield</h1>
        <p className="text-gray-600 mt-1">
          Booking fraud monitoring, site visits, drop-off leads and IP blocking
        </p>
      </div>
      <SecurityClient
        initialOverview={overview.data || null}
        initialStats={stats?.data || null}
      />
    </div>
  );
}
