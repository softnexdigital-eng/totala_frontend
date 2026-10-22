import Link from 'next/link';
import { fetchBackendJson } from '../../../lib/api';
import { getAuthToken } from '@/lib/serverAuth';
import HospitalsClient from './hospitals-client';

async function getHospitals() {
  const token = await getAuthToken();
  return fetchBackendJson('/api/hospitals', token, { next: { revalidate: 60 } });
}

export default async function HospitalsPage() {
  const data = await getHospitals();

  if (!data) {
    return <div>Please login</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Hospitals</h1>
        <Link
          href="/hospitals/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Hospital
        </Link>
      </div>

      <HospitalsClient initialHospitals={data.data || []} />
    </div>
  );
}
