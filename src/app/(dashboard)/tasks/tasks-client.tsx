'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { TaskDocumentCells } from './task-documents-viewer';

interface AppointmentTest {
  id: string;
  testName: string;
  actualCost?: number;
  finalCost?: number;
  status?: string;
}

interface Appointment {
  id: string;
  date: string;
  status: string;
  serviceType: string;
  serviceFee: number;
  serialNo?: string | null;
  serialTime?: string | null;
  patient?: { name: string; phone?: string };
  doctor?: { name: string; specialization?: string };
  tests?: AppointmentTest[];
}

interface Agent {
  id: string;
  name: string;
  phone: string;
}

interface Task {
  id: string;
  taskStatus: string;
  specialInstructions?: string;
  notes?: string;
  discountPercent?: number;
  discountAmount?: number;
  transactionId?: string;
  bkashNumber?: string;
  prescriptions?: string[];
  invoiceUrl?: string | null;
  receiveTime?: string;
  startTime?: string;
  endTime?: string;
  /**
   * Freeze workflow flags computed by the backend:
   * - `awaitingEnd`: payment submitted (cash Add Payment / bKash-Nagad-Rocket)
   *   and the task is disabled until the Super Admin clicks End.
   * - `isDisabled`: no further agent action allowed on this task.
   * - `canEnd`: the "End" button may be enabled (payment exists).
   */
  isDisabled?: boolean;
  awaitingEnd?: boolean;
  canEnd?: boolean;
  appointment: Appointment;
  agent: Agent;
  payments?: {
    id: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    paymentDate?: string;
    notes?: string;
    transactionId?: string;
    senderNumber?: string;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  SERVICE_COMPLETED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

// Compact cell classes keep all 12 columns visible without horizontal scrolling.
const TH = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500';
const TD = 'px-3 py-2 align-top whitespace-nowrap text-xs text-gray-700';
const TD_WRAP = 'px-3 py-2 align-top text-xs text-gray-700';

interface TasksClientProps {
  initialTasks: Task[];
}

function formatTimer(startTime?: string) {
  if (!startTime) return null;
  const start = new Date(startTime).getTime();
  if (Number.isNaN(start)) return null;
  const diff = Date.now() - start;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Total time the timer ran (endTime - startTime), shown AFTER the task ends so
 * the admin can still see how long the service took (fix for "end task korle
 * timer ta koto chollo dekha jay na").
 */
function formatDurationMs(ms: number): string | null {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const total = Math.floor(ms / 1000);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function formatSerialTime(value?: string | null) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function TasksClient({ initialTasks }: TasksClientProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [timers, setTimers] = useState<Record<string, string>>({});
  const [invoiceFiles, setInvoiceFiles] = useState<Record<string, File | null>>({});
  const [uploadingInvoice, setUploadingInvoice] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const next: Record<string, string> = {};
        let changed = false;
        tasks.forEach((task) => {
          if (task.taskStatus === 'IN_PROGRESS') {
            const timer = formatTimer(task.startTime);
            if (timer) {
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

  const getStatusColor = (status: string) => STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID_CLEARED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_VERIFICATION':
        return 'bg-indigo-100 text-indigo-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAdminToken = () => {
    const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const authHeaders = (): Record<string, string> => {
    const token = getAdminToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /**
   * End Task — Super Admin only.
   *
   * The task is disabled the moment the agent's service-charge payment is
   * submitted (cash "Add Payment" or online bKash / Nagad / Rocket), and stays
   * disabled — with the whole agent frozen for new bookings — until this End
   * click. The backend `approve` route flips a frozen SERVICE_COMPLETED task to
   * COMPLETED (and stamps endTime); the agent-facing `/end` route only handles
   * IN_PROGRESS -> SERVICE_COMPLETED, so we must call `/approve` here.
   */
  const handleEndTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        credentials: 'include',
      });

      console.log('End task response status:', response.status);

      const result = await response.json();
      console.log('End task result:', result);

      if (result.success) {
        toast.success('টাস্ক শেষ করা হলো — এজেন্ট ফ্রিজ উঠেছে');
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? result.data : t))
        );
      } else {
        toast.error(result.message || 'টাস্ক শেষ করা যায়নি');
      }
    } catch (error) {
      console.error('End task error:', error);
      toast.error('কিছু সমস্যা হয়েছে — সার্ভারের সাথে সংযোগ ব্যর্থ');
    }
  };

  const handlePaymentStatusUpdate = async (paymentId: string, paymentStatus: string) => {
    try {
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ paymentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Payment status updated');
        setTasks((prev) =>
          prev.map((t) => {
            if (!t.payments) return t;
            return {
              ...t,
              payments: t.payments.map((p) => (p.id === paymentId ? result.data : p)),
            };
          })
        );
      } else {
        toast.error(result.message || 'Failed to update payment status');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleStatusUpdate = async (taskId: string, taskStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ taskStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Task status updated');
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? result.data : t))
        );
      } else {
        toast.error(result.message || 'Failed to update task');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  const handleApproveTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({}),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Task approved');
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? result.data : t))
        );
      } else {
        toast.error(result.message || 'Failed to approve task');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetch('/api/tasks', {
          headers: authHeaders(),
        });
        const result = await response.json();
        if (result.success) {
          setTasks(result.data || []);
        }
      } catch (error) {
        // silent refresh failure
      }
    };

    const interval = setInterval(() => {
      loadTasks();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Super admin uploads the test invoice (doctor prescription is uploaded by the
  // agent). File goes to Cloudinary through /api/upload first, then the resulting
  // URL is stored on the task via /api/tasks/[id]/documents.
  const handleInvoiceUpload = async (taskId: string) => {
    const file = invoiceFiles[taskId];
    if (!file) {
      toast.error('Choose the test invoice file first');
      return;
    }

    setUploadingInvoice(taskId);
    try {
      const form = new FormData();
      form.append('file', file);
      const uploadRes = await fetch('/api/upload?type=receipts', { method: 'POST', body: form });
      const uploadData = await uploadRes.json();

      if (!uploadData?.success) {
        toast.error(uploadData?.message || 'Upload failed');
        return;
      }

      const url: string = uploadData.data?.url || uploadData.url;
      const res = await fetch(`/api/tasks/${taskId}/documents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ invoiceUrl: url }),
      });
      const data = await res.json();

      if (data?.success) {
        toast.success('Test invoice uploaded');
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.data : t)));
        setInvoiceFiles((prev) => ({ ...prev, [taskId]: null }));
      } else {
        toast.error(data?.message || 'Failed to save invoice');
      }
    } catch {
      toast.error('Invoice upload failed');
    } finally {
      setUploadingInvoice(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {tasks.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No tasks found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className={TH}>Patient</th>
                <th className={TH}>Doctor</th>
                <th className={TH}>Agent</th>
                <th className={TH}>Date / Serial</th>
                <th className={TH}>Tests Given</th>
                <th className={TH}>Task Status</th>
                <th className={TH}>Timer</th>
                <th className={TH}>Rx</th>
                <th className={TH}>Invoice</th>
                <th className={TH}>Payment</th>
                <th className={TH}>Transaction</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => {
                const payment = task.payments?.[0];
                /**
                 * Freeze gate: the Super Admin "End" button is enabled ONLY
                 * once the agent has submitted the service-charge payment
                 * (cash Add Payment / online bKash-Nagad-Rocket). Until the End
                 * click the task stays disabled and the agent stays frozen.
                 */
                const hasPayment = (task.payments?.length || 0) > 0;
                const canEnd =
                  typeof task.canEnd === 'boolean'
                    ? task.canEnd
                    : task.taskStatus === 'SERVICE_COMPLETED' && hasPayment;
                const awaitingEnd = task.awaitingEnd ?? task.taskStatus === 'SERVICE_COMPLETED';
                const timer = task.taskStatus === 'IN_PROGRESS' ? timers[task.id] || formatTimer(task.startTime) : null;
                // Final duration survives the End click — endTime is stamped on
                // payment submit (SERVICE_COMPLETED) and kept on COMPLETED.
                const finalDuration =
                  !timer && task.startTime && task.endTime
                    ? formatDurationMs(
                        new Date(task.endTime).getTime() - new Date(task.startTime).getTime()
                      )
                    : null;
                const tests = task.appointment.tests || [];
                const invoiceUploadLabel = task.invoiceUrl ? 'Replace Invoice' : 'Upload Invoice';

                return (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className={TD}>
                      <span className="font-medium text-gray-900">{task.appointment.patient?.name || 'N/A'}</span>
                      {task.appointment.patient?.phone && (
                        <span className="block text-[11px] text-gray-500">{task.appointment.patient.phone}</span>
                      )}
                    </td>
                    <td className={TD}>
                      <span>{task.appointment.doctor?.name || 'N/A'}</span>
                      {task.appointment.doctor?.specialization && (
                        <span className="block text-[11px] text-gray-500">{task.appointment.doctor.specialization}</span>
                      )}
                    </td>
                    <td className={TD}>{task.agent.name}</td>
                    <td className={TD}>
                      <span>{new Date(task.appointment.date).toLocaleString()}</span>
                      <span className="block text-[11px] text-gray-500">
                        #{task.appointment.serialNo || '—'} · {formatSerialTime(task.appointment.serialTime)}
                      </span>
                    </td>
                    <td className={TD_WRAP}>
                      {tests.length > 0 ? (
                        <div className="flex max-w-[190px] flex-col items-start gap-0.5">
                          {tests.map((test) => (
                            <span
                              key={test.id}
                              className="max-w-full truncate rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700"
                              title={`${test.testName}${test.finalCost != null ? ` — ${test.finalCost} BDT` : ''}`}
                            >
                              {test.testName}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className={TD}>
                      <span
                        className={`px-2 inline-flex text-[11px] leading-5 font-semibold rounded-full ${getStatusColor(
                          task.taskStatus
                        )}`}
                      >
                        {task.taskStatus}
                      </span>
                    </td>
                    <td className={TD}>
                      {timer ? (
                        <span className="font-mono text-red-600">{timer}</span>
                      ) : finalDuration ? (
                        <span
                          className="font-mono text-slate-700"
                          title={`Total time: started ${task.startTime ? new Date(task.startTime).toLocaleString() : '—'} · ended ${task.endTime ? new Date(task.endTime).toLocaleString() : '—'}`}
                        >
                          {finalDuration}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {finalDuration && <span className="block text-[10px] text-gray-500">Total</span>}
                    </td>
                    <TaskDocumentCells task={task} />
                    <td className={TD}>
                      {payment ? (
                        <>
                          <select
                            value={payment.paymentStatus}
                            onChange={(e) => handlePaymentStatusUpdate(payment.id, e.target.value)}
                            className={`text-[11px] px-2 py-1 rounded-full border-0 font-semibold cursor-pointer ${getPaymentStatusColor(payment.paymentStatus)}`}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="SUBMITTED">Submitted</option>
                            <option value="UNDER_VERIFICATION">Under Verification</option>
                            <option value="PAID_CLEARED">Paid/Cleared</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="REFUNDED">Refunded</option>
                          </select>
                          <span className="mt-1 block text-[11px] text-gray-500">
                            {payment.paymentMethod.replace(/_/g, ' ')} · {payment.amount} BDT
                          </span>
                        </>
                      ) : (
                        <span className="text-gray-400">No payment</span>
                      )}
                    </td>
                    <td className={TD}>
                      <span className="block">{payment?.transactionId || '-'}</span>
                      {payment?.senderNumber && (
                        <span className="block text-[11px] text-gray-500">{payment.senderNumber}</span>
                      )}
                    </td>
                    <td className={TD_WRAP}>
                      <div className="flex flex-col items-start gap-1">
                        {/* Freeze indicator — payment submitted, End pending */}
                        {awaitingEnd && (
                          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-white">
                            Freeze · awaiting End
                          </span>
                        )}
                        {awaitingEnd && !canEnd && (
                          <button
                            onClick={() => handleApproveTask(task.id)}
                            title="Legacy টাস্ক: পেমেন্ট রেকর্ড ছাড়াই শেষ করা হয়েছে — Approve করলে agent unfreeze হবে"
                            className="rounded bg-green-700 px-2 py-1 text-[11px] text-white hover:bg-green-800"
                          >
                            Approve to End
                          </button>
                        )}
                        {canEnd && (
                          <button
                            onClick={() => handleEndTask(task.id)}
                            className="rounded bg-purple-600 px-2 py-1 text-[11px] text-white hover:bg-purple-700"
                          >
                            End Task
                          </button>
                        )}
                        {!canEnd && !awaitingEnd && task.taskStatus !== 'COMPLETED' && (
                          <button
                            disabled
                            title="এজেন্টের সার্ভিস চার্জ পেমেন্ট জমা হলে End enable হবে"
                            className="cursor-not-allowed rounded bg-gray-200 px-2 py-1 text-[11px] text-gray-500"
                          >
                            End Task
                          </button>
                        )}
                        {task.taskStatus === 'COMPLETED' && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                            Ended
                          </span>
                        )}
                        {task.taskStatus !== 'CANCELLED' && task.taskStatus !== 'COMPLETED' && (
                          <div className="flex w-40 flex-col items-start gap-1">
                            <input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) =>
                                setInvoiceFiles((prev) => ({
                                  ...prev,
                                  [task.id]: e.target.files?.[0] || null,
                                }))
                              }
                              className="w-full text-[10px]"
                            />
                            <button
                              onClick={() => handleInvoiceUpload(task.id)}
                              disabled={uploadingInvoice === task.id || !invoiceFiles[task.id]}
                              className="rounded bg-amber-600 px-2 py-1 text-[11px] text-white hover:bg-amber-700 disabled:opacity-50"
                            >
                              {uploadingInvoice === task.id ? 'Uploading…' : invoiceUploadLabel}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
