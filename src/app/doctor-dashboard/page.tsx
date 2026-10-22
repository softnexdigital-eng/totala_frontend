'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import DoctorDashboardLayout from '@/components/layout/DoctorDashboardLayout';

interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  mobileNumber?: string;
  specialization?: string;
  title?: string;
  bmdcRegNo?: string;
  registrationStatus?: string;
  isVerified?: boolean;
}

interface Appointment {
  id: string;
  date: string;
  status: string;
  serviceType: string;
  serviceFee: number;
  hospital?: string;
  serialNo?: string | null;
  serialTime?: string | null;
  patient?: { name?: string; phone?: string } | null;
  agent?: { name?: string } | null;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  received: 'bg-indigo-100 text-indigo-800',
  ongoing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function DoctorDashboardPage() {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getDoctorToken = () => {
    const match = document.cookie.match(/(?:^|; )doctorToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/doctors/me', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.data) setDoctor(data.data);
    } catch {
      // Profile card simply stays empty.
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = getDoctorToken();
      const res = await fetch('/api/appointments', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success) setAppointments(data.data || []);
      else toast.error(data.message || 'অ্যাপয়েন্টমেন্ট আনতে ব্যর্থ');
    } catch {
      toast.error('অ্যাপয়েন্টমেন্ট আনতে ব্যর্থ');
    }
  };

  useEffect(() => {
    Promise.all([fetchProfile(), fetchAppointments()]).finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (appointmentId: string, status: string) => {
    setUpdatingId(appointmentId);
    try {
      const token = getDoctorToken();
      const res = await fetch(`/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('স্ট্যাটাস আপডেট সফল');
        setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? data.data : a)));
      } else {
        toast.error(data.message || 'স্ট্যাটাস আপডেট ব্যর্থ');
      }
    } catch {
      toast.error('স্ট্যাটাস আপডেট ব্যর্থ');
    }
    setUpdatingId(null);
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  const total = appointments.length;
  const upcoming = appointments.filter((a) => ['pending', 'confirmed', 'received', 'ongoing'].includes(a.status)).length;
  const completed = appointments.filter((a) => a.status === 'completed').length;

  return (
    <DoctorDashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">মোট অ্যাপয়েন্টমেন্ট</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{total}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">সক্রিয়</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{upcoming}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">সম্পন্ন</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{completed}</p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">আমার অ্যাপয়েন্টমেন্ট</h2>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          কোনো অ্যাপয়েন্টমেন্ট পাওয়া যায়নি।
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">তারিখ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">রোগী</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">সিরিয়াল</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ফি</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">স্ট্যাটাস</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(appointment.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.patient?.name || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.serialNo || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {appointment.serviceFee} BDT
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {appointment.status === 'confirmed' && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'received')}
                        disabled={updatingId === appointment.id}
                        className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 text-xs"
                      >
                        Received
                      </button>
                    )}
                    {appointment.status === 'received' && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'ongoing')}
                        disabled={updatingId === appointment.id}
                        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 text-xs"
                      >
                        Ongoing
                      </button>
                    )}
                    {appointment.status === 'ongoing' && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                        disabled={updatingId === appointment.id}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 text-xs"
                      >
                        Complete
                      </button>
                    )}
                    {!['completed', 'cancelled', 'confirmed', 'received', 'ongoing'].includes(appointment.status) && (
                      <button
                        onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                        disabled={updatingId === appointment.id}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-xs"
                      >
                        Confirm
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DoctorDashboardLayout>
  );
}
