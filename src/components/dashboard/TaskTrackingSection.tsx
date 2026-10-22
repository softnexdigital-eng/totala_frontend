'use client';

import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentGroup } from '@/components/common/DocumentViewer';

/**
 * Super-admin "Task Tracking" widget.
 *
 * It reads `GET /api/tasks/tracking` — the SAME shared `Task` table that the
 * agent mutates via "Receive Task" (`taskStatus -> RECEIVED`, `receiveTime`)
 * and "Receive Patient" (`taskStatus -> IN_PROGRESS`, `startTime`).
 *
 * Because the agent and the super admin read from one shared source, whatever
 * stage the agent is in (and whatever timer they see) is mirrored here in real
 * time — exactly as required.
 */

interface TrackingAgent {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}
interface TrackingPatient {
  name: string;
  phone?: string;
  address?: string;
}
interface TrackingDoctor {
  name: string;
  specialization?: string;
}
interface TrackingTest {
  id: string;
  testName: string;
  finalCost?: number;
}
interface TrackingAppointment {
  id: string;
  date: string;
  serviceType: string;
  serviceFee: number;
  hospital?: string | null;
  serialNo?: string | null;
  serialTime?: string | null;
  patient?: TrackingPatient | null;
  doctor?: TrackingDoctor | null;
  tests?: TrackingTest[];
}
interface TaskTrackingEntry {
  id: string;
  appointmentId: string;
  agentId: string;
  taskStatus: string;
  displayStatus: string;
  receiveTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  elapsedSeconds?: number | null;
  prescriptions?: string[];
  invoiceUrl?: string | null;
  /**
   * Freeze workflow flags from the backend:
   * - `awaitingEnd`: service-charge payment submitted (cash / bKash / Nagad /
   *   Rocket) — task disabled until the Super Admin ends it.
   * - `isDisabled`: the agent cannot act on this task anymore.
   * - `canEnd`: the Super Admin "End" button is allowed (payment exists).
   */
  isDisabled?: boolean;
  awaitingEnd?: boolean;
  canEnd?: boolean;
  createdAt: string;
  updatedAt: string;
  agent: TrackingAgent;
  appointment: TrackingAppointment;
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-blue-100 text-blue-800',
  RECEIVED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  SERVICE_COMPLETED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function elapsedHms(startTime: string | null | undefined, nowMs: number): string | null {
  if (!startTime) return null;
  const start = new Date(startTime).getTime();
  if (Number.isNaN(start)) return null;
  const diff = nowMs - start;
  if (diff <= 0) return '00:00:00';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1_000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Final duration of a finished timer (endTime - startTime). Keeps showing how
 * long the task ran AFTER the super admin ends it (fix for the missing timer).
 */
function durationHms(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string | null {
  if (!startTime || !endTime) return null;
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  return elapsedHms(startTime, end);
}

function fmtClock(date: string | null | undefined) {
  if (!date) return '-';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatWhen(date: string) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/**
 * Freeze badge + Super Admin "End" button.
 *
 * The task is disabled as soon as the agent submits the service-charge payment
 * (cash "Add Payment" or online bKash / Nagad / Rocket). The End button is only
 * enabled once that payment exists; clicking it completes the task and unfreezes
 * the agent so new bookings become possible again.
 */
function EndTaskCell({
  task,
  token,
  onEnded,
}: {
  task: TaskTrackingEntry;
  token: string;
  onEnded: (id: string, updated: any) => void;
}) {
  const [busy, setBusy] = useState(false);

  const awaitingEnd = task.awaitingEnd ?? task.taskStatus === 'SERVICE_COMPLETED';
  const canEnd = task.canEnd ?? awaitingEnd;

  if (task.taskStatus === 'COMPLETED') {
    return <span className="text-xs font-medium text-green-700">Ended</span>;
  }

  if (!awaitingEnd) {
    return (
      <button
        type="button"
        disabled
        title="এজেন্টের সার্ভিস চার্জ পেমেন্ট জমা হলে End চালু হবে"
        className="cursor-not-allowed rounded bg-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-500"
      >
        End
      </button>
    );
  }

  if (!canEnd) {
    return <span className="text-xs text-amber-700">Payment pending — End locked</span>;
  }

  const handleEnd = async () => {
    setBusy(true);
    try {
      // Super-admin "End" unfreezes a frozen agent (task is SERVICE_COMPLETED
      // because the payment was submitted). The agent-facing `/end` route only
      // handles IN_PROGRESS -> SERVICE_COMPLETED, so for an awaiting-end task we
      // must hit the `/approve` route which flips SERVICE_COMPLETED -> COMPLETED.
      const res = await fetch(`/api/tasks/${task.id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      console.log('End task response status:', res.status);
      const data = await res.json();
      console.log('End task result:', data);
      if (data?.success) {
        toast.success('টাস্ক শেষ করা হলো — এজেন্ট ফ্রিজ উঠেছে');
        onEnded(task.id, data.data);
      } else {
        toast.error(data?.message || 'টাস্ক শেষ করা যায়নি');
      }
    } catch (error) {
      console.error('End task error:', error);
      toast.error('কিছু সমস্যা হয়েছে — সার্ভারের সাথে সংযোগ ব্যর্থ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleEnd}
      disabled={busy}
      className="rounded bg-purple-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
    >
      {busy ? 'Ending…' : 'End'}
    </button>
  );
}

function ProgressCell({ task }: { task: TaskTrackingEntry }) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);

  // IN_PROGRESS === agent clicked "Receive Patient" -> show the LIVE running timer.
  if (task.taskStatus === 'IN_PROGRESS' && task.startTime) {
    return (
      <div className="flex flex-col">
        <span className="font-mono text-sm font-medium text-red-600">
          {elapsedHms(task.startTime, nowMs) ?? '-'}
        </span>
        <span className="text-xs text-slate-500">Started at {fmtClock(task.startTime)}</span>
      </div>
    );
  }

  if (task.endTime) {
    const total = durationHms(task.startTime, task.endTime);
    return (
      <div className="flex flex-col">
        {total && (
          <span className="font-mono text-sm font-medium text-slate-800" title="Total time the timer ran">
            {total}
          </span>
        )}
        <span className="text-xs text-slate-500">
          {total ? 'Total · ended at ' : 'Ended at '}
          {fmtClock(task.endTime)}
        </span>
      </div>
    );
  }
  if (task.startTime) {
    return <span className="text-sm text-slate-700">Started at {fmtClock(task.startTime)}</span>;
  }
  if (task.receiveTime) {
    return <span className="text-sm text-slate-700">Received at {fmtClock(task.receiveTime)}</span>;
  }
  return <span className="text-sm text-slate-400">—</span>;
}

interface TaskTrackingSectionProps {
  token: string;
}

export default function TaskTrackingSection({ token }: TaskTrackingSectionProps) {
  const [tasks, setTasks] = useState<TaskTrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTracking = async () => {
    try {
      const res = await fetch('/api/tasks/tracking', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data?.success) {
        setTasks(data.data || []);
      } else if (!res.ok) {
        toast.error(data?.message || 'Failed to load task tracking');
      }
    } catch {
      // keep last known data on transient errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const poll = setInterval(fetchTracking, 30_000);
    return () => clearInterval(poll);
  }, [token]);

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Task Tracking</h2>
        {!loading && tasks.length > 0 && (
          <span className="text-xs text-slate-500">
            {tasks.filter((t) => t.taskStatus === 'IN_PROGRESS').length} in progress ·{' '}
            {tasks.length} total
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-slate-500">No tasks to track.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-600">
                <th className="px-4 py-2">Agent</th>
                <th className="px-4 py-2">Patient</th>
                <th className="px-4 py-2">Doctor</th>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Tests Given</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Freeze / End</th>
                <th className="px-4 py-2">Documents</th>
                <th className="px-4 py-2">Progress / Timer</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">{task.agent?.name || '-'}</span>
                    {task.agent?.phone && (
                      <span className="block text-xs text-slate-500">{task.agent.phone}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{task.appointment?.patient?.name || '-'}</td>
                  <td className="px-4 py-3">{task.appointment?.doctor?.name || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatWhen(task.appointment?.date ?? new Date().toISOString())}
                    <span className="block text-xs text-slate-500">
                      #{task.appointment?.serialNo || '—'} ·{' '}
                      {task.appointment?.serialTime ? fmtClock(task.appointment.serialTime) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(task.appointment?.tests?.length || 0) > 0 ? (
                      <div className="flex flex-col gap-0.5 text-xs text-slate-700">
                        {task.appointment!.tests!.map((test) => (
                          <span
                            key={test.id}
                            className="max-w-[180px] truncate"
                            title={test.finalCost != null ? `${test.testName} — ${test.finalCost} BDT` : test.testName}
                          >
                            {test.testName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No tests</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={task.displayStatus || task.taskStatus} />
                    {(task.awaitingEnd ?? task.taskStatus === 'SERVICE_COMPLETED') && (
                      <span className="mt-1 block text-[11px] font-semibold text-slate-700">
                        Agent frozen
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EndTaskCell
                      task={task}
                      token={token}
                      onEnded={(id, updated) =>
                        setTasks((prev) =>
                          prev.map((t) => (t.id === id ? { ...t, ...updated } : t))
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3">
                    <DocumentGroup
                      files={[
                        ...(task.prescriptions || []).map((url, i) => ({
                          url,
                          label: `Rx ${i + 1}`,
                        })),
                        ...(task.invoiceUrl
                          ? [{ url: task.invoiceUrl, label: 'Invoice' }]
                          : []),
                      ]}
                      title={`Documents · ${task.appointment?.patient?.name || 'Patient'}`}
                      emptyText="No documents"
                      maxVisible={4}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <ProgressCell task={task} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

