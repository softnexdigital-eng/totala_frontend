import { notFound } from 'next/navigation';
import { fetchBackendJson } from '../../../../lib/api';
import { getAuthToken } from '@/lib/serverAuth';
import HospitalForm from '../hospital-form';

async function getHospital(id: string) {
  const token = await getAuthToken();
  return fetchBackendJson(`/api/hospitals/${id}`, token);
}

export default async function HospitalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getHospital(params.id);

  if (!data || !data.success) {
    notFound();
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Hospital</h1>
      <HospitalForm hospitalData={data.data} />
    </div>
  );
}
