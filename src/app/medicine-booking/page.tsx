import MedicineBookingClient from './medicine-booking-client';

export const dynamic = 'force-dynamic';

async function getMedicines() {
  const response = await fetch('/api/medicines', {
    cache: 'no-store',
  });

  if (!response.ok) return null;
  return response.json();
}

export default async function MedicineBookingPage() {
  const data = await getMedicines();

  if (!data || !data.success) {
    return <div className="p-6">Failed to load medicines</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Online Medicine Booking</h1>
          <p className="mt-2 text-gray-600">
            Order medicines online with prescription verification for safe delivery.
          </p>
        </div>
        <MedicineBookingClient initialMedicines={data.data || []} />
      </div>
    </div>
  );
}
