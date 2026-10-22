'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Doctor {
  id: string;
  name: string;
  title?: string | null;
  designation?: string;
  specialty?: string;
  consultationFee?: number;
  hospital?: string;
  visitingDays?: string;
  visitingTime?: string;
  appointmentUrl?: string;
  isActive: boolean;
  email?: string | null;
  mobileNumber?: string | null;
  bmdcRegNo?: string | null;
  degree?: string | null;
  gender?: string | null;
  description?: string | null;
  registrationStatus?: string;
  isVerified?: boolean;
  createdAt?: string;
}

interface DoctorsClientProps {
  initialDoctors: Doctor[];
}

export default function DoctorsClient({ initialDoctors }: DoctorsClientProps) {
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [registrations, setRegistrations] = useState<Doctor[]>([]);
  const [actionId, setActionId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetch('/api/doctors/registrations?status=PENDING')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRegistrations(data.data || []);
        }
      })
      .catch(() => {
        /* approval queue is non-critical — keep the page usable */
      });
  }, []);

  const filteredDoctors = doctors.filter((doctor) =>
    doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.specialty || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doctor.hospital || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRegistrationAction = async (
    id: string,
    status: 'APPROVED' | 'REJECTED'
  ) => {
    const approve = status === 'APPROVED';
    const question = approve
      ? 'এই ডাক্তারের নিবন্ধন অনুমোদন করবেন?'
      : 'এই ডাক্তারের নিবন্ধন প্রত্যাখ্যান করবেন?';
    if (!confirm(question)) return;

    setActionId(id);
    try {
      const response = await fetch(`/api/doctors/${id}/registration-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          approve ? 'নিবন্ধন অনুমোদিত হয়েছে' : 'নিবন্ধন প্রত্যাখ্যাত হয়েছে'
        );
        setRegistrations((prev) => prev.filter((r) => r.id !== id));
        setDoctors((prev) =>
          prev.map((d) =>
            d.id === id
              ? {
                  ...d,
                  registrationStatus: status,
                  isVerified: approve ? true : d.isVerified,
                  isActive: approve,
                }
              : d
          )
        );
      } else {
        toast.error(result.message || 'আপডেট ব্যর্থ');
      }
    } catch {
      toast.error('আপডেট ব্যর্থ');
    }
    setActionId(null);
  };

  const registrationQueue = (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-800">
          নিবন্ধন অনুরোধ
          <span
            className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
              registrations.length > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {registrations.length}
          </span>
        </h2>
        {registrations.length > 0 && (
          <span className="text-xs text-gray-500">
            অনুমোদনের অপেক্ষায় থাকলে ডাক্তার সক্রিয় হবেন না
          </span>
        )}
      </div>
      {registrations.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-500">
          কোনো নতুন নিবন্ধন অনুরোধ নেই
        </p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {registrations.map((reg) => (
            <li
              key={reg.id}
              className="px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {reg.name}
                  {reg.title ? `, ${reg.title}` : ''}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {[reg.specialty, reg.degree].filter(Boolean).join(' • ')}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {[
                    reg.email,
                    reg.mobileNumber,
                    reg.bmdcRegNo ? `BMDC: ${reg.bmdcRegNo}` : null,
                  ]
                    .filter(Boolean)
                    .join(' | ')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleRegistrationAction(reg.id, 'APPROVED')}
                  disabled={actionId === reg.id}
                  className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {actionId === reg.id ? '...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleRegistrationAction(reg.id, 'REJECTED')}
                  disabled={actionId === reg.id}
                  className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const response = await fetch(`/api/doctors/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Doctor deleted successfully!');
        setDoctors(doctors.filter((d) => d.id !== id));
      } else {
        toast.error(result.message || 'Failed to delete doctor');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  return (
    <>
      {registrationQueue}
      <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b">
        <input
          type="text"
          placeholder="Search doctors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap gap-2">
          <a
            href="https://www.populardiagnostic.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1.5 bg-white border rounded hover:bg-gray-100"
          >
            Popular Diagnostic
          </a>
          <a
            href="https://app.sayemhospital.com/doctors"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1.5 bg-white border rounded hover:bg-gray-100"
          >
            Sayem Hospital Doctors
          </a>
          <a
            href="https://sodesh.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1.5 bg-white border rounded hover:bg-gray-100"
          >
            Sodesh
          </a>
          <a
            href="https://seradoctor.com/blog-details/delta-hospital-mymensingh-doctor-list"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-3 py-1.5 bg-white border rounded hover:bg-gray-100"
          >
            Delta Hospital Doctor List
          </a>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Designation
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Specialty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Fee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hospital
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Visiting Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Active
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Registration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDoctors.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  No doctors found
                </td>
              </tr>
            ) : (
              filteredDoctors.map((doctor) => (
                <tr key={doctor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.designation || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.specialty || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doctor.consultationFee != null ? `${doctor.consultationFee} BDT` : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.hospital || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doctor.visitingDays || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${doctor.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {doctor.isActive ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const status = doctor.registrationStatus || 'APPROVED';
                      const styles: Record<string, string> = {
                        PENDING: 'bg-amber-100 text-amber-800',
                        APPROVED: 'bg-green-100 text-green-800',
                        REJECTED: 'bg-red-100 text-red-800',
                      };
                      return (
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status] || 'bg-gray-100 text-gray-700'}`}
                        >
                          {status}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => router.push(`/doctors/${doctor.id}`)}
                      className="text-blue-600 hover:text-blue-800 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(doctor.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
}
