'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  getBookingStatusLabel,
  getBookingStatusColor,
  BOOKING_STATUS_OPTIONS,
  formatDate,
} from '@/lib/bookingOptions';
import { formatBDT, paymentStatusColor, paymentStatusLabel } from '@/lib/payments';

interface AgentOption {
  id: string;
  name: string;
  /** Freeze workflow: previous task payment awaiting Super Admin "End". */
  isFrozen?: boolean;
}

interface DoctorOption {
  id: string;
  name: string;
  title?: string;
  specialization?: string;
  fee?: number | null;
  hospital?: string;
  isActive: boolean;
  registrationStatus?: string;
}

interface BookingRow {
  id: string;
  serialNo?: string;
  serialTime?: string;
  patientId?: string;
  patientName?: string;
  patientPhone?: string;
  patientAge?: any;
  patientGender?: string;
  patientAddress?: string;
  agentId?: string;
  agentName?: string;
  agent?: { id: string; name: string };
  doctorId?: string;
  doctorName?: string;
  doctor?: { id: string; name: string } | null;
  serviceNeeded?: string;
  serviceType?: string;
  preferredDate?: string;
  date?: string;
  preferredTime?: string;
  time?: string;
  hospital?: string;
  address?: string;
  status?: string;
  createdAt?: string;
  /** Payment snapshot recorded by the landing-page gateway checkout. */
  totalServiceCharge?: number;
  minRequiredPayment?: number;
  amountPaid?: number;
  remainingDue?: number;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionId?: string;
}

// Statuses that show up as "Confirmed" — these cannot be set until the
// serial number has been written for the booking request.
const CONFIRM_STATUSES = ['APPROVED', 'ASSIGNED'];

/** ISO timestamp -> value for <input type="datetime-local"> (local time). */
const toDateTimeLocal = (iso?: string | null): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

/** datetime-local value -> ISO string (empty picker means "no time"). */
const toIsoOrNull = (value: string): string | null => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export default function AgentBookingRequestsPage() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [serialInputs, setSerialInputs] = useState<Record<string, string>>({});
  const [serialTimeInputs, setSerialTimeInputs] = useState<Record<string, string>>({});
  const [doctorInputs, setDoctorInputs] = useState<Record<string, string>>({});
  const [doctorIdInputs, setDoctorIdInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [bookingsRes, agentsRes, doctorsRes] = await Promise.all([
          fetch('/api/bookings'),
          fetch('/api/agents'),
          fetch('/api/public/doctors'),
        ]);

        const bookingsJson = await bookingsRes.json();
        const agentsJson = await agentsRes.json();
        const doctorsJson = await doctorsRes.json();

        if (bookingsJson.success) setBookings(bookingsJson.data || []);
        if (agentsJson.success) setAgents(agentsJson.data || []);
        if (doctorsJson.success) setDoctors(doctorsJson.data || []);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const assignAgent = async (id: string, agentId: string) => {
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/bookings/${id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Agent assigned');
        setBookings((prev) =>
          prev.map((bk) =>
            bk.id === id
              ? {
                  ...bk,
                  agentId,
                  agent: { id: agentId, name: json.data?.agent?.name || bk.agent?.name || '' },
                  agentName: json.data?.agent?.name || bk.agentName || '',
                }
              : bk
          )
        );
      } else {
        toast.error(json.message || 'Failed to assign agent');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmittingId(null);
    }
  };

  const getSerialValue = (b: BookingRow) =>
    (serialInputs[b.id] ?? b.serialNo ?? '').trim();

  // Persist the typed serial number on its own (called when the input blurs).
  const saveSerialNo = async (b: BookingRow) => {
    const serialNo = getSerialValue(b);
    if (serialNo === (b.serialNo || '').trim()) return;

    setSubmittingId(b.id);
    try {
      const res = await fetch(`/api/bookings/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialNo }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Serial No saved');
        setBookings((prev) =>
          prev.map((bk) =>
            bk.id === b.id
              ? { ...bk, serialNo: json.data?.serialNo ?? serialNo }
              : bk
          )
        );
      } else {
        toast.error(json.message || 'Failed to save serial no');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmittingId(null);
    }
  };

  const getSerialTimeValue = (b: BookingRow) =>
    serialTimeInputs[b.id] ?? toDateTimeLocal(b.serialTime);

  // Persist the picked serial time on its own (called when the picker blurs).
  const saveSerialTime = async (b: BookingRow) => {
    const value = getSerialTimeValue(b);
    if (value === toDateTimeLocal(b.serialTime)) return;

    setSubmittingId(b.id);
    try {
      const res = await fetch(`/api/bookings/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serialTime: toIsoOrNull(value) }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Serial Time saved');
        setBookings((prev) =>
          prev.map((bk) =>
            bk.id === b.id
              ? { ...bk, serialTime: json.data?.serialTime ?? toIsoOrNull(value) }
              : bk
          )
        );
      } else {
        toast.error(json.message || 'Failed to save serial time');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmittingId(null);
    }
  };

  // Resolve the doctorId for a typed/picked doctor name (editable combobox).
  const resolveDoctorId = (name: string): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const match = doctors.find(
      (d) => d.isActive && d.name.toLowerCase() === trimmed.toLowerCase()
    );
    return match ? match.id : null;
  };

  // Persist the picked/overridden doctor on its own (called on input blur).
  const saveDoctor = async (b: BookingRow) => {
    const doctorName = (doctorInputs[b.id] ?? b.doctorName ?? b.doctor?.name ?? '').trim();
    const doctorId =
      doctorInputs[b.id] !== undefined
        ? resolveDoctorId(doctorInputs[b.id])
        : b.doctorId || null;
    const nextName = doctorName || null;

    const currentName = (b.doctorName || b.doctor?.name || '').trim();
    if (nextName === currentName && doctorId === (b.doctorId || null)) {
      return;
    }

    setSubmittingId(b.id);
    try {
      const res = await fetch(`/api/bookings/${b.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorId, doctorName: nextName }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Doctor saved');
        setBookings((prev) =>
          prev.map((bk) =>
            bk.id === b.id
              ? {
                  ...bk,
                  doctorId: json.data?.doctorId ?? doctorId,
                  doctorName: json.data?.doctorName ?? nextName,
                }
              : bk
          )
        );
        // Clear the pending editor so the cell re-renders the saved value.
        setDoctorInputs((prev) => {
          const next = { ...prev };
          delete next[b.id];
          return next;
        });
        setDoctorIdInputs((prev) => {
          const next = { ...prev };
          delete next[b.id];
          return next;
        });
      } else {
        toast.error(json.message || 'Failed to save doctor');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmittingId(null);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const current = bookings.find((bk) => bk.id === id);
    const serialNo = current ? getSerialValue(current) : '';

    // Status cannot be confirmed before the serial number is written.
    if (CONFIRM_STATUSES.includes(status) && !serialNo) {
      toast.error('Please write the Serial No before confirming the status');
      return;
    }

    setSubmittingId(id);
    try {
      const payload: { status: string; serialNo?: string; serialTime?: string | null } = { status };
      if (current && serialNo !== (current.serialNo || '').trim()) {
        payload.serialNo = serialNo;
      }
      // A pending (not yet saved) picker value travels with the status change.
      if (current && serialTimeInputs[id] !== undefined) {
        payload.serialTime = toIsoOrNull(serialTimeInputs[id]);
      }

      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Booking status updated');
        setBookings((prev) =>
          prev.map((bk) =>
            bk.id === id
              ? {
                  ...bk,
                  status,
                  serialNo: json.data?.serialNo ?? serialNo,
                  serialTime: json.data?.serialTime ?? bk.serialTime,
                }
              : bk
          )
        );
      } else {
        toast.error(json.message || 'Failed to update status');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSubmittingId(null);
    }
  };

  const filtered = bookings.filter((b) => {
    const term = searchTerm.toLowerCase();
    return (
      (b.patientName || '').toLowerCase().includes(term) ||
      (b.patientPhone || '').includes(term.replace(/\s/g, ''))
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full max-w-full mx-auto">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Agent Booking Requests</h1>
          <p className="text-gray-600 mt-1">
            Booking requests submitted from the public landing page. Review patient
            details, assign an agent and update the status of each request.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by patient name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No booking requests found</div>
        ) : (
          <div className="overflow-x-auto">
            {/* Shared doctor list for the per-row editable combobox. */}
            <datalist id="admin-doctors-list">
              {doctors.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.title ? `(${d.title})` : ''} {d.specialization}
                </option>
              ))}
            </datalist>
            <table className="w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Serial No</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Serial Time</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Booking ID</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Patient Name</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Phone</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Age</th>
                   <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Agent Name</th>
                   <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Doctor</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Service Needed</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Preferred Date</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Preferred Time</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Address</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Status</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Payment</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Created Date</th>
                  <th className="px-2 py-2 text-left text-[10px] font-semibold text-gray-500 uppercase leading-tight">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <input
                        type="text"
                        value={serialInputs[b.id] ?? b.serialNo ?? ''}
                        disabled={submittingId === b.id}
                        placeholder="Serial No"
                        onChange={(e) =>
                          setSerialInputs((prev) => ({
                            ...prev,
                            [b.id]: e.target.value,
                          }))
                        }
                        onBlur={() => saveSerialNo(b)}
                        className="w-20 text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-green-500 focus:border-transparent"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <input
                        type="datetime-local"
                        value={getSerialTimeValue(b)}
                        disabled={submittingId === b.id}
                        onChange={(e) =>
                          setSerialTimeInputs((prev) => ({
                            ...prev,
                            [b.id]: e.target.value,
                          }))
                        }
                        onBlur={() => saveSerialTime(b)}
                        className="w-40 text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-green-500 focus:border-transparent"
                      />
                    </td>
                    <td
                      className="px-2 py-2 text-[10px] font-mono text-gray-500 max-w-[90px] truncate"
                      title={b.id}
                    >
                      …{b.id.slice(-8)}
                    </td>
                    <td className="px-2 py-2">
                      <div>
                        <p className="text-xs font-medium text-gray-900 leading-tight">{b.patientName || '-'}</p>
                        {b.patientGender && (
                          <p className="text-[10px] text-gray-500">{b.patientGender}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs whitespace-nowrap">{b.patientPhone || '-'}</td>
                    <td className="px-2 py-2 text-xs">{b.patientAge || '-'}</td>
                    <td className="px-2 py-2">
                      <select
                        value={b.agentId || ''}
                        disabled={submittingId === b.id}
                        onChange={(e) => {
                          const agentId = e.target.value;
                          if (!agentId) return;
                          assignAgent(b.id, agentId);
                        }}
                        className="text-xs border border-gray-300 rounded px-1 py-1 w-28 focus:ring-1 focus:ring-green-500"
                      >
                        <option value="" disabled>
                          {submittingId === b.id ? 'Updating...' : 'Select agent'}
                        </option>
                        <option value="">Unassigned</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id} disabled={agent.isFrozen}>
                            {agent.name}
                            {agent.isFrozen ? ' — Freeze' : ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2" title={b.doctorName || b.doctor?.name || undefined}>
                      {/* Editable doctor combobox: pick from the list or type an
                          override. The picked doctor's id is resolved on save. */}
                      <input
                        type="text"
                        list="admin-doctors-list"
                        value={doctorInputs[b.id] ?? b.doctorName ?? b.doctor?.name ?? ''}
                        disabled={submittingId === b.id}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDoctorInputs((prev) => ({ ...prev, [b.id]: value }));
                          const match = doctors.find(
                            (d) =>
                              d.isActive &&
                              d.name.toLowerCase() === value.trim().toLowerCase()
                          );
                          setDoctorIdInputs((prev) => ({
                            ...prev,
                            [b.id]: match ? match.id : '',
                          }));
                        }}
                        onBlur={() => {
                          // Only persist when the editor actually changed the value.
                          if (doctorInputs[b.id] !== undefined) saveDoctor(b);
                        }}
                        className="w-44 text-xs border border-gray-300 rounded px-1.5 py-1 focus:ring-1 focus:ring-green-500"
                      />
                    </td>
                    <td className="px-2 py-2 text-xs max-w-[110px] break-words leading-tight">
                      {b.serviceNeeded || b.serviceType || '-'}
                    </td>
                    <td className="px-2 py-2 text-xs whitespace-nowrap">{formatDate(b.preferredDate || b.date)}</td>
                    <td className="px-2 py-2 text-xs whitespace-nowrap">{b.preferredTime || b.time || '-'}</td>
                    <td className="px-2 py-2 text-xs max-w-[120px] break-words leading-tight">
                      {b.patientAddress || b.address || '-'}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={`px-1.5 inline-flex text-[10px] leading-4 font-semibold rounded-full ${getBookingStatusColor(b.status)}`}
                      >
                        {getBookingStatusLabel(b.status)}
                      </span>
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                          {formatBDT(b.amountPaid || 0)}
                        </span>
                        {(b.remainingDue || 0) > 0 && (
                          <span className="text-[10px] text-rose-600 whitespace-nowrap">
                            Due {formatBDT(b.remainingDue)}
                          </span>
                        )}
                        <span
                          className={`px-1.5 inline-flex text-[10px] leading-4 font-semibold rounded-full self-start ${paymentStatusColor(
                            b.paymentStatus
                          )}`}
                        >
                          {paymentStatusLabel(b.paymentStatus)}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs whitespace-nowrap">{formatDate(b.createdAt)}</td>
                    <td className="px-2 py-2 w-[150px]">
                      <select
                        value=""
                        disabled={submittingId === b.id}
                        onChange={(e) => {
                          if (e.target.value) updateStatus(b.id, e.target.value);
                        }}
                        className="text-xs border border-gray-300 rounded px-1 py-1 w-full focus:ring-1 focus:ring-green-500"
                      >
                        <option value="" disabled>
                          {submittingId === b.id ? 'Updating...' : 'Change status'}
                        </option>
                        {BOOKING_STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

