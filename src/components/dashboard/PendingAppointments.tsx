'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getStatusLabel, getStatusColor } from '@/lib/appointmentStatus';

interface Appointment {
  id: string;
  patient: { name: string };
  doctor: { name: string; specialization: string };
  agent?: { id: string; name: string };
  date: string;
  status: string;
  serviceType: string;
  serviceFee: number;
  discountPercent?: number;
  notes?: string;
  serialNo?: string | null;
  serialTime?: string | null;
}

interface Agent {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface Payment {
  id: string;
  paymentStatus: string;
}

interface Task {
  id: string;
  taskStatus: string;
  startTime?: string;
  agent?: { id: string; name: string };
  appointment?: { id: string };
}

interface PendingAppointmentsProps {
  token: string;
}

const PER_PAGE = 10;

function IconCalendar({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
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
            disabled={page >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 disabled:opacity-50"
            aria-label="Next page"
          >
            <IconChevronRight />
          </button>
        </div>
      )}
    </div>
  );
}

function TaskCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border-l-4 border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div className="h-3 w-28 rounded bg-slate-100" />
        <div className="h-5 w-16 rounded-full bg-slate-100" />
      </div>
      <div className="mt-4 space-y-2.5">
        <div className="h-3 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
        <div className="h-3 w-3/4 rounded bg-slate-100" />
      </div>
      <div className="mt-4 h-9 w-full rounded-lg bg-slate-100" />
      <div className="mt-2 flex gap-2">
        <div className="h-9 flex-1 rounded-lg bg-slate-100" />
        <div className="h-9 flex-1 rounded-lg bg-slate-100" />
      </div>
    </div>
  );
}

/** Serial time stamped by the booking flow — shown on the appointment card. */
function formatSerialTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function PendingAppointments({ token }: PendingAppointmentsProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment[]>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timers, setTimers] = useState<Record<string, string>>({});

  const getTaskForAppointment = (appointmentId: string) => {
    return tasks.find((t) => t.appointment?.id === appointmentId);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next: Record<string, string> = {};
        let changed = false;
        tasks.forEach((task) => {
          if (task.taskStatus === 'IN_PROGRESS' && task.startTime) {
            const start = new Date(task.startTime).getTime();
            if (!Number.isNaN(start)) {
              const diff = Date.now() - start;
              const hours = Math.floor(diff / (1000 * 60 * 60));
              const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
              const seconds = Math.floor((diff % (1000 * 60)) / 1000);
              const timer = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
              next[task.id] = timer;
              if (prev[task.id] !== timer) changed = true;
            }
          }
        });
        return changed ? { ...prev, ...next } : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks]);

  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [editForm, setEditForm] = useState({
    date: '',
    serviceType: 'online',
    agentId: '',
    notes: '',
    whatsappNumber: '',
  });

  useEffect(() => {
    fetchPendingAppointments();
    fetchAgents();
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load tasks');
    }
  };


  const fetchPendingAppointments = async () => {
    try {
      const response = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const items = data.data || [];
        setAppointments(items);
        await fetchPaymentsForAppointments(items);
      }
    } catch (error) {
      toast.error('Failed to load pending appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentsForAppointments = async (items: Appointment[]) => {
    try {
      const results = await Promise.all(
        items.map(async (apt) => {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payments/appointments/${apt.id}/payments`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
              return [apt.id, data.data || []] as const;
            }
            return [apt.id, []] as const;
          } catch {
            return [apt.id, []] as const;
          }
        })
      );

      const map: Record<string, Payment[]> = {};
      results.forEach(([id, pts]) => {
        map[id] = pts;
      });
      setPayments(map);
    } catch {
      // silent payment fetch failure
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load agents');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'confirmed' }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Appointment approved successfully!');
        fetchPendingAppointments();
      } else {
        toast.error(result.message || 'Failed to approve appointment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this appointment?')) return;

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Appointment rejected');
        fetchPendingAppointments();
      } else {
        toast.error(result.message || 'Failed to reject appointment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleAgentChange = async (appointmentId: string, agentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId: agentId || null }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Agent updated successfully!');
        fetchPendingAppointments();
      } else {
        toast.error(result.message || 'Failed to update agent');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleEdit = async (id: string) => {
    if (!editForm.date) {
      toast.error('Please select a date');
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: editForm.date,
          serviceType: editForm.serviceType,
          agentId: editForm.agentId || null,
          notes: editForm.notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Appointment updated successfully!');
        setEditingId(null);
        fetchPendingAppointments();
      } else {
        toast.error(result.message || 'Failed to update appointment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const startEdit = (apt: Appointment) => {
    setEditingId(apt.id);
    setEditForm({
      date: apt.date.slice(0, 16),
      serviceType: apt.serviceType,
      agentId: apt.agent?.id || '',
      notes: apt.notes || '',
      whatsappNumber: '',
    });
  };

  useEffect(() => {
    const load = async () => {
      await fetchPendingAppointments();
      await fetchTasks();
    };
    const interval = setInterval(() => {
      load();
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const getPaymentStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Payment Pending',
      SUBMITTED: 'Submitted',
      UNDER_VERIFICATION: 'Under Verification',
      PAID_CLEARED: 'Paid/Cleared',
      REJECTED: 'Rejected',
      REFUNDED: 'Refunded',
    };
    return labels[status] || status;
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_VERIFICATION: 'bg-indigo-100 text-indigo-800',
      PAID_CLEARED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getLatestPaymentStatus = (appointmentId: string) => {
    const list = payments[appointmentId];
    if (!list || list.length === 0) return null;
    return list[0].paymentStatus;
  };

  const totalPages = Math.max(1, Math.ceil(appointments.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedAppointments = appointments.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  if (loading) {
    return (
      <div className="mt-8">
        <div className="h-5 w-56 animate-pulse rounded bg-slate-100" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (appointments.length === 0) {
    return null;
  }

  const pendingCount = appointments.filter((a) => {
    const paymentStatus = getLatestPaymentStatus(a.id);
    return !paymentStatus || paymentStatus === 'PENDING';
  }).length;

  return (
    <div className="mt-8 sm:mt-10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
        <h2 className="text-base font-semibold text-orange-600 sm:text-lg">Task Tracking</h2>
        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-700">
          {pendingCount} pending
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        {paginatedAppointments.map((apt) => {
          const paymentStatus = getLatestPaymentStatus(apt.id);
          const task = getTaskForAppointment(apt.id);
          const taskStatus = task?.taskStatus;
          const taskTimer = task && timers[task.id];

          const displayStatus = taskStatus || apt.status;
          const statusLabel = paymentStatus ? getPaymentStatusLabel(paymentStatus) : getStatusLabel(displayStatus);
          const statusColor = paymentStatus ? getPaymentStatusColor(paymentStatus) : getStatusColor(displayStatus);

          return (
            <div
              key={apt.id}
              className={`flex flex-col rounded-2xl border-l-4 bg-white p-5 shadow-sm transition-colors ${
                !paymentStatus || paymentStatus === 'PENDING' ? 'border-orange-400' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <IconCalendar className="h-4 w-4 text-slate-400" />
                  {new Date(apt.date).toLocaleString()}
                </div>
                <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusColor}`}>
                  {statusLabel}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-indigo-50 px-2.5 py-1 font-semibold text-indigo-700">
                  Serial: {apt.serialNo || '—'}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                  Serial Time: {formatSerialTime(apt.serialTime)}
                </span>
              </div>

              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <IconUser className="h-4 w-4 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{apt.patient?.name || 'Not assigned'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 text-xs font-medium uppercase tracking-wide text-slate-400">Dr</span>
                  <span className="truncate">
                    {apt.doctor ? `${apt.doctor.name} · ${apt.doctor.specialization}` : 'Not assigned'}
                  </span>
                </div>
                {task && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium">Agent:</span>
                    <span>{task.agent?.name || apt.agent?.name || 'Unassigned'}</span>
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                    {apt.serviceType}
                  </span>
                  <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {apt.serviceFee} BDT
                  </span>
                  {apt.status === 'completed' && apt.discountPercent != null && (
                    <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                      {apt.discountPercent}% discount
                    </span>
                  )}
                </div>
                {taskTimer && (
                  <div className="flex items-center gap-2 text-xs text-red-600">
                    <span className="font-medium">Timer:</span>
                    <span className="font-mono">{taskTimer}</span>
                  </div>
                )}
                {apt.notes && (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">{apt.notes}</p>
                )}
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3">
                <label className="mb-1 block text-xs font-medium text-slate-500">Assign Agent</label>
                <select
                  defaultValue={apt.agent?.id || ''}
                  onChange={(e) => handleAgentChange(apt.id, e.target.value)}
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

              <div className="mt-3">
                {task ? (
                  <p className="text-center text-sm font-medium text-slate-700">
                    Task: {taskStatus}
                  </p>
                ) : apt.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(apt.id)}
                      className="min-h-[40px] flex-1 rounded-lg bg-green-600 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(apt.id)}
                      className="min-h-[40px] flex-1 rounded-lg border border-red-200 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                ) : apt.status === 'completed' ? (
                  <p className="text-center text-sm font-medium text-green-700">Task Completed</p>
                ) : apt.status === 'cancelled' ? (
                  <p className="text-center text-sm text-red-600">Cancelled</p>
                ) : (
                  <p className="text-center text-sm text-slate-600">
                    {apt.agent ? `${apt.agent.name}: ` : ''}
                    {getStatusLabel(apt.status)}
                  </p>
                )}
              </div>

              <button
                onClick={() => startEdit(apt)}
                className="mt-2 min-h-[40px] w-full rounded-lg border border-teal-200 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-50"
              >
                {editingId === apt.id ? 'Editing…' : 'Edit Appointment'}
              </button>

              {editingId === apt.id && (
                <div className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={editForm.date}
                      onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                      className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Service Type</label>
                    <select
                      value={editForm.serviceType}
                      onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })}
                      className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="online">Online (50 BDT)</option>
                      <option value="package">Package (500 BDT)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Agent</label>
                    <select
                      value={editForm.agentId}
                      onChange={(e) => setEditForm({ ...editForm, agentId: e.target.value })}
                      className="min-h-[40px] w-full rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="">No Agent</option>
                      {agents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Notes</label>
                    <textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(apt.id)}
                      className="min-h-[40px] flex-1 rounded-lg bg-teal-700 text-sm font-medium text-white transition-colors hover:bg-teal-800"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="min-h-[40px] rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={appointments.length}
        perPage={PER_PAGE}
        onChange={setPage}
      />
    </div>
  );
}
