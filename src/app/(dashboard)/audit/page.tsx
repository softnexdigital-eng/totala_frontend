import { fetchBackendJson } from '../../../lib/api';
import { getAuthToken } from '@/lib/serverAuth';
import AuditClient from './audit-client';

async function getAuditLogs(searchParams?: { [key: string]: string | string[] | undefined }) {
  const token = await getAuthToken();
  
  let url = '/api/audit-logs';
  if (searchParams && Object.keys(searchParams).length > 0) {
    const query = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        query.append(key, value);
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  return fetchBackendJson(url, token);
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const data = await getAuditLogs(searchParams);

  if (!data) {
    return <div>Please login</div>;
  }

  return (
    <div className="p-6 max-w-7.5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Report</h1>
        <p className="text-gray-600 mt-1">
          System activity logs and changes
        </p>
      </div>
      <AuditClient initialLogs={data.data || []} />
    </div>
  );
}
