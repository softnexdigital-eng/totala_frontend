'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import AgentDashboardLayout from '@/components/layout/AgentDashboardLayout';
import { formatBDT, paymentStatusColor, paymentStatusLabel } from '@/lib/payments';

interface Task {
  id: string;
  taskStatus: string;
  specialInstructions?: string;
  notes?: string;
  appointment: {
    id: string;
    date: string;
    serviceType: string;
    serviceFee: number;
    totalServiceCharge?: number;
    amountPaid?: number;
    remainingDue?: number;
    paymentStatus?: string;
    patient?: { name: string; phone?: string };
    doctor?: { name: string; specialization?: string };
    hospital?: string;
    serialNo?: string | null;
    serialTime?: string | null;
  };
  agent: {
    id: string;
    name: string;
  };
  payments: Payment[];
}

interface Payment {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentDate?: string;
  notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ACCEPTED: 'bg-indigo-100 text-indigo-800',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
  SERVICE_COMPLETED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

/** Serial time stamped by the booking flow — shown on the task card. */
function formatSerialTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function AgentDashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  const getAgentToken = () => {
    const match = document.cookie.match(/(?:^|; )agentToken=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const fetchTasks = async () => {
    try {
      const token = getAgentToken();
      const res = await fetch('/api/tasks', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (data.success) setTasks(data.data || []);
      else toast.error(data.message || 'Failed to load tasks');
    } catch {
      toast.error('Failed to load tasks');
    }
  };

  useEffect(() => {
    fetchTasks().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReceiveTask = async (taskId: string) => {
    setUpdating(true);
    try {
      const token = getAgentToken();
      const res = await fetch(`/api/tasks/${taskId}/receive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task received');
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.data : t)));
      } else {
        toast.error(data.message || 'Failed to receive task');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartTask = async (taskId: string) => {
    setUpdating(true);
    try {
      const token = getAgentToken();
      const res = await fetch(`/api/tasks/${taskId}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Patient received, timer started');
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.data : t)));
      } else {
        toast.error(data.message || 'Failed to start task');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * The agent never ends a task anymore — the Super Admin does it from the
   * dashboard "End" button. The agent's job is: Receive Task → Receive Patient
   * → Add Payment (cash / bKash / Nagad / Rocket). Submitting the payment
   * disables the task and freezes the agent until the Super Admin ends it.
   */
  const handleAddPayment = (taskId: string) => {
    router.push(`/agent-dashboard/tasks/${taskId}#payment`);
  };

  const handleStatusUpdate = async (taskId: string, taskStatus: string) => {
    setUpdating(true);
    try {
      const token = getAgentToken();
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ taskStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Task status updated');
        setTasks((prev) => prev.map((t) => (t.id === taskId ? data.data : t)));
      } else {
        toast.error(data.message || 'Failed to update task');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';

  /**
   * Freeze rule (agent side): once any of this agent's tasks has a submitted
   * service-charge payment and is waiting for the Super Admin's "End", the whole
   * agent is frozen — no new booking, no new task, and the card that was booked
   * stays disabled. Only the Super Admin "End" click unfreezes it.
   */
  const frozen = tasks.some((t) => t.taskStatus === 'SERVICE_COMPLETED');
  const frozenTaskCount = tasks.filter((t) => t.taskStatus === 'SERVICE_COMPLETED').length;

  return (
    <AgentDashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, Agent</h1>
        <p className="text-gray-600 mt-2">Manage your tasks and payments</p>
      </div>

      {frozen && (
        <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900 px-5 py-4 text-white">
          <p className="text-sm font-semibold">
            আপনি এখন FREEZE আছেন — সার্ভিস চার্জ পেমেন্ট জমা হয়ে সুপার অ্যাডমিনের End
            এর অপেক্ষায় আছে।
          </p>
          <p className="mt-1 text-xs text-slate-200">
            {frozenTaskCount} টি টাস্ক End pending। ল্যান্ডিং পেজ থেকে বা ড্যাশবোর্ড থেকে
            নতুন কোনো বুকিং/টাস্ক নেওয়া যাবে না — সুপার অ্যাডমিন End করলেই সব চালু হবে।
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Tasks</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{tasks.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Pending Tasks</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">
            {tasks.filter((t) => t.taskStatus === 'PENDING' || t.taskStatus === 'ASSIGNED').length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700">Completed Tasks</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {tasks.filter((t) => t.taskStatus === 'COMPLETED').length}
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6">My Tasks</h2>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-10 text-center text-gray-500">
          No tasks assigned yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => router.push(`/agent-dashboard/tasks/${task.id}`)}
              className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <p className="text-sm text-gray-600">
                  {new Date(task.appointment.date).toLocaleString()}
                </p>
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.taskStatus)}`}>
                  {task.taskStatus}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
                  Serial: {task.appointment.serialNo || '—'}
                </span>
                <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                  Serial Time: {formatSerialTime(task.appointment.serialTime)}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium">Patient:</span>{' '}
                  {task.appointment.patient?.name || 'Not assigned'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Doctor:</span>{' '}
                  {task.appointment.doctor?.name || 'N/A'}{' '}
                  {task.appointment.doctor?.specialization ? `(${task.appointment.doctor.specialization})` : ''}
                </p>
                {task.appointment.hospital && (
                  <p className="text-sm">
                    <span className="font-medium">Hospital:</span> {task.appointment.hospital}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Service:</span>{' '}
                  <span className="capitalize">{task.appointment.serviceType}</span> — {task.appointment.serviceFee} BDT
                </p>
                {/* Payment summary (read-only for agents — backend enforces no edits) */}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Service Charge:</span>
                    <span className="font-semibold">{formatBDT(task.appointment.totalServiceCharge ?? task.appointment.serviceFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-semibold text-emerald-700">{formatBDT(task.appointment.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due:</span>
                    <span className="font-semibold text-rose-600">{formatBDT(task.appointment.remainingDue)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-gray-600">Payment Status:</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${paymentStatusColor(task.appointment.paymentStatus)}`}>
                      {paymentStatusLabel(task.appointment.paymentStatus)}
                    </span>
                  </div>
                </div>
                {task.specialInstructions && (
                  <p className="text-sm">
                    <span className="font-medium">Instructions:</span> {task.specialInstructions}
                  </p>
                )}
                {task.notes && (
                  <p className="text-sm">
                    <span className="font-medium">Notes:</span> {task.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t">
                {task.taskStatus === 'ASSIGNED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReceiveTask(task.id);
                    }}
                    disabled={updating || frozen}
                    title={frozen ? 'Freeze আছে — সুপার অ্যাডমিন End করলে চালু হবে' : undefined}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium mb-2"
                  >
                    Receive Task
                  </button>
                )}
                {task.taskStatus === 'RECEIVED' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartTask(task.id);
                    }}
                    disabled={updating || frozen}
                    title={frozen ? 'Freeze আছে — সুপার অ্যাডমিন End করলে চালু হবে' : undefined}
                    className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium mb-2"
                  >
                    Receive Patient
                  </button>
                )}

                {/*
                  Agent workflow ends with the payment: "Add Payment" (cash or
                  online bKash / Nagad / Rocket) submits the service charge, the
                  task becomes disabled and the agent is frozen until the Super
                  Admin clicks End on the dashboard.
                */}
                {task.taskStatus === 'IN_PROGRESS' &&
                  task.appointment.serviceFee -
                    (task.payments?.reduce((sum, p) => sum + p.amount, 0) || 0) >
                    0 && (
                  <div className="space-y-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddPayment(task.id);
                      }}
                      disabled={updating || frozen}
                      title={frozen ? 'Freeze আছে — সুপার অ্যাডমিন End করলে চালু হবে' : undefined}
                      className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium"
                    >
                      Add Payment (Cash / bKash / Nagad / Rocket)
                    </button>
                    <p className="text-[11px] text-gray-500">
                      বাকি{' '}
                      {(task.appointment.serviceFee -
                        (task.payments?.reduce((sum, p) => sum + p.amount, 0) ||
                          0)).toLocaleString('bn-BD')} BDT পরিশোধ করতে
                      Add Payment দিন। পেমেন্ট জমা হলে টাস্ক disable হবে।
                    </p>
                  </div>
                )}

                {task.taskStatus === 'SERVICE_COMPLETED' && (
                  <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-800">
                    Payment submitted — task disabled. সুপার অ্যাডমিন End pending।
                  </div>
                )}
                {task.taskStatus === 'COMPLETED' && (
                  <div className="rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-800">
                    Super Admin End করেছে — task completed, freeze lifted।
                  </div>
                )}

                {['ASSIGNED', 'RECEIVED', 'IN_PROGRESS'].includes(task.taskStatus) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(task.id, 'CANCELLED');
                    }}
                    disabled={updating || frozen}
                    title={frozen ? 'Freeze আছে — সুপার অ্যাডমিন End করলে চালু হবে' : undefined}
                    className="mt-2 w-full border border-red-200 text-red-700 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50 text-sm font-medium"
                  >
                    Cancel Task
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AgentDashboardLayout>
  );
}