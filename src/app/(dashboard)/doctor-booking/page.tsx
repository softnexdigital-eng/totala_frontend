'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import SearchablePatientSelect from '@/components/forms/SearchablePatientSelect';
import { getStatusLabel as getStatusLabelFn, getStatusColor as getStatusColorFn } from '@/lib/appointmentStatus';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  fee: number;
  hospital?: string;
  phone?: string;
  isActive: boolean;
}

interface Agent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
}

interface Appointment {
  id: string;
  patientId?: string;
  doctorId: string;
  doctorName?: string;
  agentId?: string;
  hospital?: string;
  date: string;
  status: string;
  serviceType: string;
  serviceFee: number;
  discountPercent?: number;
  serialNo?: string | null;
  serialTime?: string | null;
  notes?: string;
  doctor?: { name: string; specialization: string };
  patient?: { name: string };
  agent?: { id: string; name: string };
}

interface Package {
  id: string;
  name: string;
  finalPrice: number;
  discountPercent: number;
  isActive: boolean;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
}

const DOCTORS_PER_PAGE = 6;
const APPOINTMENTS_PER_PAGE = 6;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Task Pending' },
  { value: 'received', label: 'Task Received' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

/* ---------- small presentational helpers ---------- */

const AVATAR_PALETTE = [
  { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-100' },
  { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-100' },
  { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-100' },
  { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-100' },
  { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-100' },
];

function paletteFor(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[idx];
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function IconPhone({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M6.6 10.8c1.3 2.6 3.4 4.7 6 6l2-2c.3-.3.7-.4 1-.2 1 .3 2.1.5 3.3.5.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.9c.6 0 1 .4 1 1 0 1.2.2 2.3.5 3.3.1.4 0 .7-.2 1l-2 2z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHospital({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 21V10a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v11" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 8v.01M7 12v.01M7 16v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 13h2M17 12v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M20 20l-3.8-3.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconUser({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 20c1.4-3.4 4.4-5.2 7.5-5.2s6.1 1.8 7.5 5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronLeft({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconChevronRight({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Pagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onChange: (page: number) => void;
}) {
  if (totalItems === 0) return null;

  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, totalItems);

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-xs text-slate-500">
        Showing <span className="font-medium text-slate-700">{start}–{end}</span> of{' '}
        <span className="font-medium text-slate-700">{totalItems}</span>
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Previous page"
          >
            <IconChevronLeft />
          </button>
          <span className="min-w-[5.5rem] text-center text-sm font-medium text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Next page"
          >
            <IconChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

function DoctorCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start gap-3">
        <div className="h-11 w-11 flex-shrink-0 rounded-full bg-slate-100" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 w-2/3 rounded bg-slate-100" />
          <div className="h-3 w-1/2 rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="h-3 w-1/3 rounded bg-slate-100" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
      </div>
      <div className="mt-4 h-10 w-full rounded-xl bg-slate-100" />
    </div>
  );
}

function AppointmentCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="h-3 w-24 rounded bg-slate-100" />
        <div className="h-5 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-9 flex-1 rounded-lg bg-slate-100" />
        <div className="h-9 flex-1 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

export default function DoctorBookingPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);
  const [doctorsPage, setDoctorsPage] = useState(1);
  const [appointmentsPage, setAppointmentsPage] = useState(1);

  const [formData, setFormData] = useState({
    patientId: '',
    date: '',
    serviceType: 'online',
    agentId: '',
    notes: '',
    whatsappNumber: '',
    packageId: '',
    packageDiscount: '0',
    serialNo: '',
    serialTime: '',
  });

  useEffect(() => {
    fetchData();
    const agentCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('agent='));

    if (agentCookie) {
      try {
        const agentData = JSON.parse(decodeURIComponent(agentCookie.split('=')[1]));
        setCurrentAgentId(agentData.id);
      } catch {
        setCurrentAgentId(null);
      }
    }
  }, []);

  // Reset to page 1 whenever the appointment filters change
  useEffect(() => {
    setAppointmentsPage(1);
  }, [searchTerm, filterStatus]);

  const fetchData = async () => {
    try {
      const [doctorsRes, patientsRes, agentsRes, appointmentsRes, packagesRes] = await Promise.all([
        fetch('/api/doctors', { credentials: 'include' }),
        fetch('/api/patients', { credentials: 'include' }),
        fetch('/api/agents', { credentials: 'include' }),
        fetch('/api/appointments', { credentials: 'include' }),
        fetch('/api/packages'),
      ]);

      const doctorsData = await doctorsRes.json();
      const patientsData = await patientsRes.json();
      const agentsData = await agentsRes.json();
      const appointmentsData = await appointmentsRes.json();
      const packagesData = await packagesRes.json();

      if (doctorsData.success) setDoctors(doctorsData.data || []);
      if (patientsData.success) setPatients(patientsData.data || []);
      if (agentsData.success) setAgents(agentsData.data || []);
      if (appointmentsData.success) setAppointments(appointmentsData.data || []);
      if (packagesData.success) setPackages(packagesData.data || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowBookingForm(true);
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor) return;

    setIsSubmitting(true);

    try {
      const payload: any = {
        patientId: formData.patientId,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        agentId: currentAgentId || formData.agentId || null,
        date: formData.date,
        serviceType: formData.serviceType,
        notes: formData.notes,
        whatsappNumber: formData.whatsappNumber,
        serialNo: formData.serialNo.trim() || null,
        serialTime: formData.serialTime ? new Date(formData.serialTime).toISOString() : null,
      };

      if (formData.serviceType === 'package' && formData.packageId) {
        payload.packageId = formData.packageId;
        payload.packageDiscount = parseFloat(formData.packageDiscount) || 0;
      }

      const response = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Appointment booked successfully!');
        setShowBookingForm(false);
        setFormData({
          patientId: '',
          date: '',
          serviceType: 'online',
          agentId: '',
          notes: '',
          whatsappNumber: '',
          packageId: '',
          packageDiscount: '0',
          serialNo: '',
          serialTime: '',
        });
        fetchData();
      } else {
        toast.error(result.message || 'Failed to book appointment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setIsSubmitting(false);
  };

  const handleAssignAgent = async (appointmentId: string, agentId: string) => {
    try {
       const response = await fetch(`/api/appointments/${appointmentId}`, {
         method: 'PUT',
         headers: {
           'Content-Type': 'application/json',
         },
         credentials: 'include',
         body: JSON.stringify({ agentId }),
       });

      const result = await response.json();

      if (result.success) {
        toast.success('Agent assigned successfully!');
        fetchData();
      } else {
        toast.error(result.message || 'Failed to assign agent');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleEdit = (apt: Appointment) => {
    const newWin = window.open(`/appointments/${apt.id}`, '_blank');
    if (newWin) newWin.focus();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই অ্যাপয়েন্টমেন্ট ডিলিট করতে চান?')) return;

    try {
      const token = document.cookie.match(/(?:^|; )token=([^;]+)/);
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${decodeURIComponent(token[1])}` } : {},
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('অ্যাপয়েন্টমেন্ট ডিলিট করা হয়েছে');
        fetchData();
      } else {
        toast.error(result.message || 'অ্যাপয়েন্টমেন্ট ডিলিট করা যায়নি');
      }
    } catch (error) {
      toast.error('কিছু সমস্যা হয়েছে');
    }
  };

  const getStatusColor = (status: string) => getStatusColorFn(status);
  const getStatusLabel = (status: string) => getStatusLabelFn(status);

  const activeDoctors = doctors.filter((d) => d.isActive);
  const totalDoctorPages = Math.max(1, Math.ceil(activeDoctors.length / DOCTORS_PER_PAGE));
  const safeDoctorsPage = Math.min(doctorsPage, totalDoctorPages);
  const paginatedDoctors = activeDoctors.slice(
    (safeDoctorsPage - 1) * DOCTORS_PER_PAGE,
    safeDoctorsPage * DOCTORS_PER_PAGE
  );

  const filteredAppointments = appointments.filter((apt) => {
    const aptDoctorName = apt.doctor?.name || doctors.find((d) => d.id === apt.doctorId)?.name || '';
    const matchesSearch =
      aptDoctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.hospital || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (apt.patient?.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalAppointmentPages = Math.max(1, Math.ceil(filteredAppointments.length / APPOINTMENTS_PER_PAGE));
  const safeAppointmentsPage = Math.min(appointmentsPage, totalAppointmentPages);
  const paginatedAppointments = filteredAppointments.slice(
    (safeAppointmentsPage - 1) * APPOINTMENTS_PER_PAGE,
    safeAppointmentsPage * APPOINTMENTS_PER_PAGE
  );

  // Quick counts for the status chips row
  const statusCounts = appointments.reduce<Record<string, number>>((acc, apt) => {
    acc[apt.status] = (acc[apt.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="h-screen overflow-y-auto bg-[#FAFAF8]">
        <div className="mx-auto max-w-7.5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <div className="h-6 w-40 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3.5 w-64 animate-pulse rounded bg-slate-100" />

          <div className="mt-6 h-5 w-44 animate-pulse rounded bg-slate-100 sm:mt-8" />
          <div className="mt-3 grid grid-cols-1 gap-4 sm:mt-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <DoctorCardSkeleton key={i} />
            ))}
          </div>

          <div className="mt-8 h-5 w-52 animate-pulse rounded bg-slate-100 sm:mt-10" />
          <div className="mt-3 h-16 animate-pulse rounded-2xl bg-slate-100 sm:mt-4" />
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AppointmentCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    // NOTE: this container scrolls on its own (h-screen overflow-y-auto) so the page's
    // content can scroll independently of a fixed/sticky sidebar. For the sidebar to stop
    // scrolling along with this page, its wrapper needs `sticky top-0 h-screen overflow-y-auto`
    // (or `fixed`) in your layout — that's the other half of this fix and lives outside this file.
    <div className="h-screen overflow-y-auto bg-[#FAFAF8]">
      <div className="mx-auto max-w-7.5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <h1 className="text-xl font-semibold text-slate-900 sm:text-2xl">Doctor Booking</h1>
        <p className="mt-1 text-sm text-slate-500">Book appointments and manage patient bookings.</p>

        {/* Doctors Section */}
        <div className="mt-6 sm:mt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-semibold text-slate-800 sm:text-lg">Available Doctors</h2>
            <span className="text-xs text-slate-400">{activeDoctors.length} total</span>
          </div>

          {activeDoctors.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500 sm:mt-4">
              No active doctors right now.
            </div>
          ) : (
            <>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:mt-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {paginatedDoctors.map((doctor) => {
                  const palette = paletteFor(doctor.name);
                  return (
                    <div
                      key={doctor.id}
                      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-200"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${palette.bg} ${palette.text} ring-4 ${palette.ring} text-sm font-semibold`}
                        >
                          {initials(doctor.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-semibold text-slate-900">{doctor.name}</h3>
                          <p className="truncate text-sm text-slate-500">{doctor.specialization}</p>
                        </div>
                        <span className="flex-shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                          Active
                        </span>
                      </div>

                      <div className="mt-4 space-y-2 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-50 px-2.5 py-1 text-sm font-medium text-slate-700">
                            {doctor.fee} BDT
                          </span>
                        </div>
                        {doctor.hospital && (
                          <div className="flex items-center gap-2">
                            <IconHospital className="h-4 w-4 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{doctor.hospital}</span>
                          </div>
                        )}
                        {doctor.phone && (
                          <div className="flex items-center gap-2">
                            <IconPhone className="h-4 w-4 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{doctor.phone}</span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleBookAppointment(doctor)}
                        className="mt-4 min-h-[44px] w-full rounded-xl bg-teal-700 text-sm font-medium text-white transition-colors hover:bg-teal-800 active:bg-teal-900"
                      >
                        Book Appointment
                      </button>
                    </div>
                  );
                })}
              </div>

              <Pagination
                page={safeDoctorsPage}
                totalPages={totalDoctorPages}
                totalItems={activeDoctors.length}
                perPage={DOCTORS_PER_PAGE}
                onChange={setDoctorsPage}
              />
            </>
          )}
        </div>

        {/* Appointments Section */}
        <div className="mt-8 sm:mt-10">
          <h2 className="text-base font-semibold text-slate-800 sm:text-lg">Booked Appointments</h2>

          {/* Quick status chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-teal-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({appointments.length})
            </button>
            {STATUS_OPTIONS.filter((s) => s.value !== 'all').map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setFilterStatus(s.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  filterStatus === s.value
                    ? 'bg-teal-700 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {s.label} ({statusCounts[s.value] || 0})
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="sticky top-0 z-10 -mx-4 mt-3 bg-[#FAFAF8]/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                <div className="relative">
                  <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by doctor, hospital, or patient..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 sm:w-48"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              {(searchTerm || filterStatus !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterStatus('all');
                  }}
                  className="mt-2 text-xs font-medium text-teal-700 hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <IconCalendar className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm text-slate-500">No appointments match this view yet.</p>
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {paginatedAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-teal-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <IconCalendar className="h-4 w-4 text-slate-400" />
                        {new Date(apt.date).toLocaleString()}
                      </div>
                      <span
                        className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusColor(
                          apt.status
                        )}`}
                      >
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>

                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <IconUser className="h-4 w-4 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{apt.patient?.name || 'Not assigned'}</span>
                      </div>
                       <div className="flex items-center gap-2">
                         <span className="flex-shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                           Dr
                         </span>
                         <span className="truncate">
                           {apt.doctor?.name ||
                             doctors.find((d) => d.id === apt.doctorId)?.name ||
                             apt.doctorName ||
                             'N/A'}
                           {apt.doctor?.specialization
                             ? ` · ${apt.doctor.specialization}`
                             : doctors.find((d) => d.id === apt.doctorId)?.specialization
                             ? ` · ${doctors.find((d) => d.id === apt.doctorId)?.specialization}`
                             : ''}
                         </span>
                       </div>
                      {apt.hospital && (
                        <div className="flex items-center gap-2">
                          <IconHospital className="h-4 w-4 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{apt.hospital}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                          {apt.serviceType}
                        </span>
                        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {apt.serviceFee} BDT
                        </span>
                        {apt.serialNo && (
                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                            Serial: {apt.serialNo}
                            {apt.serialTime ? ` · ${new Date(apt.serialTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                          </span>
                        )}
                        {apt.status === 'completed' && (
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                            {apt.discountPercent ?? 0}% discount
                          </span>
                        )}
                      </div>

                      {/* Agent Assignment */}
                      {!currentAgentId && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                          <label className="mb-1 block text-xs font-medium text-slate-500">Assign Agent</label>
                          <select
                            defaultValue={apt.agent?.id || ''}
                            onChange={(e) => handleAssignAgent(apt.id, e.target.value)}
                            className="min-h-[40px] w-full rounded-lg border border-slate-200 px-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                          >
                            <option value="">No Agent</option>
                            {agents.map((agent) => (
                              <option key={agent.id} value={agent.id}>
                                {agent.name} ({agent.phone})
                              </option>
                            ))}
                          </select>
                          {apt.agent && (
                            <p className="mt-1 text-xs font-medium text-teal-700">Current: {apt.agent.name}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(apt)}
                        className="min-h-[40px] flex-1 rounded-lg border border-teal-200 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50 active:bg-teal-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(apt.id)}
                        className="min-h-[40px] flex-1 rounded-lg border border-red-200 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 active:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                page={safeAppointmentsPage}
                totalPages={totalAppointmentPages}
                totalItems={filteredAppointments.length}
                perPage={APPOINTMENTS_PER_PAGE}
                onChange={setAppointmentsPage}
              />
            </>
          )}
        </div>
      </div>

      {/* Booking Modal — bottom sheet on mobile, centered dialog from sm: up */}
      {showBookingForm && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center sm:justify-center sm:p-4">
          <div className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white sm:max-h-[85vh] sm:w-full sm:max-w-md sm:rounded-2xl">
            {/* drag handle, mobile only */}
            <div className="flex justify-center pt-2 sm:hidden">
              <span className="h-1.5 w-10 rounded-full bg-slate-200" />
            </div>

            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                Book with {selectedDoctor.name}
              </h3>
              <button
                onClick={() => setShowBookingForm(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form id="booking-form" onSubmit={handleSubmitBooking} className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Patient *</label>
                <SearchablePatientSelect
                  patients={patients}
                  value={formData.patientId}
                  onSelect={(p) => setFormData({ ...formData, patientId: p.id })}
                  placeholder="Search by name or phone..."
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Date & Time *</label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Service Type</label>
                <select
                  value={formData.serviceType}
                  onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  <option value="online">Online (50 BDT)</option>
                  <option value="package">Full Guidance Package</option>
                </select>
              </div>

              {formData.serviceType === 'package' && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Select Package</label>
                  <select
                    value={formData.packageId}
                    onChange={(e) => setFormData({ ...formData, packageId: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    required={formData.serviceType === 'package'}
                  >
                    <option value="">Select Package</option>
                    {packages
                      .filter((p) => p.isActive)
                      .map((pkg) => (
                        <option key={pkg.id} value={pkg.id}>
                          {pkg.name} - {pkg.finalPrice} BDT
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {formData.serviceType === 'package' && formData.packageId && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Package Discount (%)</label>
                  <input
                    type="number"
                    value={formData.packageDiscount}
                    onChange={(e) => setFormData({ ...formData, packageDiscount: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Serial Number</label>
                  <input
                    type="text"
                    value={formData.serialNo}
                    onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                    placeholder="e.g. 12"
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Serial Time</label>
                  <input
                    type="datetime-local"
                    value={formData.serialTime}
                    onChange={(e) => setFormData({ ...formData, serialTime: e.target.value })}
                    className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Agent (Optional)</label>
                <select
                  value={formData.agentId}
                  onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">None</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">WhatsApp Number</label>
                <input
                  type="text"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                  rows={3}
                />
              </div>
            </form>

            {/* sticky footer so buttons stay visible above mobile keyboards */}
            <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
              <button
                type="submit"
                form="booking-form"
                disabled={isSubmitting}
                className="min-h-[44px] flex-1 rounded-xl bg-teal-700 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
              >
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
              </button>
              <button
                type="button"
                onClick={() => setShowBookingForm(false)}
                className="min-h-[44px] rounded-xl border border-slate-200 px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}