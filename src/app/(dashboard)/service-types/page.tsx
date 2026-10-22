import ServiceTypesClient from './service-types-client';
import { fetchBackendJson } from '@/lib/api';
import { getAuthToken } from '@/lib/serverAuth';

async function getServiceTypes() {
  const token = await getAuthToken();
  if (!token) return null;

  return fetchBackendJson('/api/service-types', token, { next: { revalidate: 60 } });
}

export default async function ServiceTypesPage() {
  const data = await getServiceTypes();

  if (!data) {
    return <div className="p-6">Please login</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Service Types</h1>
      </div>
      <ServiceTypesClient initialServiceTypes={data.data || []} />
    </div>
  );
}
