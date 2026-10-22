'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { getStatusLabel, getStatusColor as getStatusColorShared } from '@/lib/appointmentStatus';
import { formatBDT, paymentStatusColor, paymentStatusLabel, computePaymentStatus } from '@/lib/payments';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital?: string;
}

interface Appointment {
  id: string;
  doctorId: string;
  doctorName?: string;
  hospital?: string;
  date: string;
  status: string;
  serviceType: string;
  serviceFee: number;
  discountPercent?: number;
  notes?: string;
  serialNo?: string | null;
  serialTime?: string | null;
  doctor?: Doctor;
  patient?: { id: string; name: string };
  agent?: { id: string; name: string };
  package?: { id: string; name: string; finalPrice: number };
  packageFinalPrice?: number;
  packageDiscount?: number;
  taskStatus?: string;
  taskStartedAt?: string;
  taskId?: string;
  /** Payment snapshot — total charge vs. what was paid up front. */
  totalServiceCharge?: number;
  minRequiredPayment?: number;
  amountPaid?: number;
  remainingDue?: number;
  paymentStatus?: string;
  paymentMethod?: string;
}

interface AppointmentsClientProps {
  initialAppointments: Appointment[];
  doctors: Doctor[];
}

export default function AppointmentsClient({ initialAppointments, doctors }: AppointmentsClientProps) {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([]);
  const [taskMap, setTaskMap] = useState<Record<string, {
    id: string;
    taskStatus: string;
    payments?: {
      id: string;
      amount: number;
      paymentMethod: string;
      paymentStatus: string;
      transactionId?: string;
      senderNumber?: string;
    }[];
  }>>({});
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [aptBeingEdited, setAptBeingEdited] = useState<Appointment | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    doctorName: '',
    hospital: '',
    date: '',
    serviceType: 'online',
    serviceTypeId: '',
    totalServiceCharge: '0',
    minRequiredPayment: '0',
    initialPayment: '0',
    paymentMethod: 'CASH',
    notes: '',
    agentId: '',
    serialNo: '',
    serialTime: '',
  });
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.doctor?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.hospital?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patient?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || apt.status === filterStatus;
    const matchesDoctor = filterDoctor === 'all' || apt.doctorId === filterDoctor;

    return matchesSearch && matchesStatus && matchesDoctor;
  });

  const hospitalOptions = Array.from(
    new Set(
      [
        ...appointments.map((a) => a.hospital).filter(Boolean) as string[],
        ...doctors.map((d) => d.hospital).filter(Boolean) as string[],
      ]
    )
  ).sort();

  useEffect(() => {
    fetch('/api/agents')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setAgents(data.data || []);
        }
      })
      .catch(() => {});
    fetch('/api/service-types')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setServiceTypes(data.data || []);
        else if (Array.isArray(data)) setServiceTypes(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const appointmentsWithTasks = appointments.filter((a) => a.taskId && !taskMap[a.taskId]);
    if (appointmentsWithTasks.length === 0) return;

    setLoadingTasks(true);
    Promise.all(
      appointmentsWithTasks.map((apt) =>
        fetch(`/api/tasks/${apt.taskId}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data) {
              setTaskMap((prev) => ({
                ...prev,
                [apt.taskId!]: data.data,
              }));
            }
          })
          .catch(() => {})
      )
    )
      .catch(() => {})
      .finally(() => setLoadingTasks(false));
  }, [appointments]);

  const resetForm = () => {
    setFormData({
      doctorId: '',
      doctorName: '',
      hospital: '',
      date: '',
      serviceType: 'online',
      serviceTypeId: '',
      totalServiceCharge: '0',
      minRequiredPayment: '0',
      initialPayment: '0',
      paymentMethod: 'CASH',
      notes: '',
      agentId: '',
      serialNo: '',
      serialTime: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingId ? `/api/appointments/${editingId}` : '/api/appointments';
      const method = editingId ? 'PUT' : 'POST';

      const total = Number(formData.totalServiceCharge) || 0;
      const minimum = Number(formData.minRequiredPayment) || 0;
      const initialPaid = Number(formData.initialPayment) || 0;
      if (total <= 0) {
        toast.error('Total service charge must be greater than 0');
        setIsSubmitting(false);
        return;
      }
      if (minimum > total) {
        toast.error('Minimum required payment cannot exceed total service charge');
        setIsSubmitting(false);
        return;
      }
      if (initialPaid < 0 || initialPaid > total) {
        toast.error('Initial payment must be between 0 and the total service charge');
        setIsSubmitting(false);
        return;
      }

      const submitPayload: any = {
        ...formData,
        totalServiceCharge: total,
        minRequiredPayment: minimum,
        serialNo: formData.serialNo.trim() || null,
        serialTime: formData.serialTime ? new Date(formData.serialTime).toISOString() : null,
      };

      if (editingId) {
        // Edits recompute amountPaid from recorded Payment rows — the upfront
        // snapshot is creation-only, so never resend it on update.
        delete submitPayload.initialPayment;
        delete submitPayload.paymentMethod;
      } else {
        submitPayload.initialPayment = initialPaid;
        submitPayload.paymentMethod = initialPaid > 0 ? formData.paymentMethod : null;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingId ? 'Appointment updated!' : 'Appointment created!');
        
        if (!editingId && formData.agentId) {
          try {
            const taskRes = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                appointmentId: result.data.id,
                agentId: formData.agentId,
                taskStatus: 'ASSIGNED',
              }),
            });
            const taskResult = await taskRes.json();
            if (taskResult.success) {
              toast.success('Task assigned to agent');
              setAppointments((prev) =>
                prev.map((a) =>
                  a.id === result.data.id
                    ? {
                        ...a,
                        agent: taskResult.data.agent,
                        taskStatus: taskResult.data.taskStatus,
                        taskId: taskResult.data.id,
                      }
                    : a
                )
              );
            }
          } catch {
            toast.error('Appointment created but task assignment failed');
          }
        }
        
        resetForm();
        if (!editingId) {
          setAppointments([result.data, ...appointments]);
        } else {
          setAppointments(appointments.map((a) => (a.id === editingId ? result.data : a)));
        }
      } else {
        toast.error(result.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setIsSubmitting(false);
  };

  const handleEdit = (apt: Appointment) => {
    setAptBeingEdited(apt);
    setEditingId(apt.id);
    setFormData({
      doctorId: apt.doctorId,
      doctorName: apt.doctorName || apt.doctor?.name || '',
      hospital: apt.hospital || '',
      date: apt.date.slice(0, 16),
      serviceType: apt.serviceType,
      serviceTypeId: (apt as any).serviceTypeId || '',
      totalServiceCharge: String((apt as any).totalServiceCharge ?? apt.serviceFee ?? 0),
      minRequiredPayment: String((apt as any).minRequiredPayment ?? 0),
      // Upfront payment is creation-only; on edit the figures come from the
      // recorded Payment rows (shown read-only in the form header note).
      initialPayment: '0',
      paymentMethod: 'CASH',
      notes: apt.notes || '',
      agentId: apt.agent?.id || '',
      serialNo: apt.serialNo || '',
      serialTime: apt.serialTime ? new Date(apt.serialTime).toISOString().slice(0, 16) : '',
    });
    setShowForm(true);
  };

  const getAuthToken = () => {
    const match = document.cookie.match(/(?:^|; )token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই অ্যাপয়েন্টমেন্ট ডিলিট করতে চান?')) return;

    try {
      const token = getAuthToken();
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('অ্যাপয়েন্টমেন্ট ডিলিট করা হয়েছে');
        setAppointments(appointments.filter((a) => a.id !== id));
      } else {
        toast.error(result.message || 'অ্যাপয়েন্টমেন্ট ডিলিট করা যায়নি');
      }
    } catch (error) {
      toast.error('কিছু সমস্যা হয়েছে');
    }
  };

  const handlePaymentStatusUpdate = async (paymentId: string, paymentStatus: string) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ paymentStatus }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Payment status updated');
        setTaskMap((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((taskId) => {
            if (updated[taskId].payments) {
              updated[taskId] = {
                ...updated[taskId],
                payments: updated[taskId].payments!.map((p) =>
                  p.id === paymentId ? result.data : p
                ),
              };
            }
          });
          return updated;
        });
      } else {
        toast.error(result.message || 'Failed to update payment status');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
  };

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

  const getStatusColor = (status: string) => getStatusColorShared(status);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Appointments</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'New Appointment'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Appointment' : 'Create Appointment'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor *
                </label>
                 <select
                   value={formData.doctorId}
                   onChange={(e) => {
                     const doctor = doctors.find((d) => d.id === e.target.value);
                     setFormData({
                       ...formData,
                       doctorId: e.target.value,
                       doctorName: doctor?.name || '',
                     });
                   }}
                   className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                   required
                 >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.name} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital/Location
                </label>
                <select
                  value={formData.hospital}
                  onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Hospital/Location</option>
                  {hospitalOptions.map((hospital) => (
                    <option key={hospital} value={hospital}>
                      {hospital}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type
                </label>
                <select
                  value={formData.serviceTypeId || ''}
                  onChange={(e) => {
                    const st = serviceTypes.find((s) => s.id === e.target.value);
                    setFormData({
                      ...formData,
                      serviceTypeId: e.target.value,
                      totalServiceCharge: st ? String(st.serviceCharge ?? st.charge ?? 0) : formData.totalServiceCharge,
                      minRequiredPayment: st ? String(st.minRequiredPayment ?? st.minimumPayment ?? 0) : formData.minRequiredPayment,
                    });
                  }}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select service (legacy: online/package)</option>
                  {serviceTypes.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.name} — ৳{st.serviceCharge ?? st.charge ?? 0}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total Service Charge (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.totalServiceCharge}
                  onChange={(e) => setFormData({ ...formData, totalServiceCharge: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Required Payment (৳) *
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.totalServiceCharge || undefined}
                  value={formData.minRequiredPayment}
                  onChange={(e) => setFormData({ ...formData, minRequiredPayment: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Due after minimum: ৳{Math.max(0, (Number(formData.totalServiceCharge) || 0) - (Number(formData.minRequiredPayment) || 0)).toLocaleString()}
                </p>
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Payment Received (৳)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalServiceCharge || undefined}
                    value={formData.initialPayment}
                    onChange={(e) => setFormData({ ...formData, initialPayment: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining due: ৳{Math.max(0, (Number(formData.totalServiceCharge) || 0) - (Number(formData.initialPayment) || 0)).toLocaleString()}
                    {' · '}
                    <span
                      className={`font-semibold ${paymentStatusColor(
                        computePaymentStatus(
                          Number(formData.totalServiceCharge) || 0,
                          Number(formData.initialPayment) || 0
                        )
                      )}`}
                    >
                      {paymentStatusLabel(
                        computePaymentStatus(
                          Number(formData.totalServiceCharge) || 0,
                          Number(formData.initialPayment) || 0
                        )
                      )}
                    </span>
                  </p>
                </div>
              )}

              {!editingId && (Number(formData.initialPayment) || 0) > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="HUB_DIRECT">Hub Direct</option>
                  </select>
                </div>
              )}

              {editingId && (Number((aptBeingEdited as any)?.amountPaid) || 0) > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Already Received
                  </label>
                  <p className="text-sm text-emerald-700 font-semibold px-4 py-2 border border-emerald-200 bg-emerald-50 rounded-lg">
                    {formatBDT((aptBeingEdited as any).amountPaid)}{' '}
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${paymentStatusColor(
                        (aptBeingEdited as any).paymentStatus
                      )}`}
                    >
                      {paymentStatusLabel((aptBeingEdited as any).paymentStatus)}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Payments are managed from the task / payments pages.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Agent
                </label>
                <select
                  value={formData.agentId}
                  onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No Agent</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  value={formData.serialNo}
                  onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                  placeholder="e.g. 12"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.serialTime}
                  onChange={(e) => setFormData({ ...formData, serialTime: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by doctor, hospital, or patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Task Pending</option>
            <option value="received">Task Received</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No appointments found
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">Appointment</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(apt.date).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                    apt.status
                  )}`}
                >
                  {getStatusLabel(apt.status)}
                </span>
                {apt.taskStatus && (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      apt.taskStatus === 'IN_PROGRESS'
                        ? 'bg-red-100 text-red-800'
                        : apt.taskStatus === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Task: {apt.taskStatus}
                  </span>
                )}
                {apt.taskId && taskMap[apt.taskId]?.payments?.[0] && (() => {
                  const task = taskMap[apt.taskId];
                  const payment = task.payments![0];
                  return (
                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Change Payment Status
                      </label>
                      <select
                        value={payment.paymentStatus}
                        onChange={(e) =>
                          handlePaymentStatusUpdate(
                            payment.id,
                            e.target.value
                          )
                        }
                        className={`text-xs px-2 py-1 rounded-full border-0 font-semibold cursor-pointer ${getPaymentStatusColor(
                          payment.paymentStatus
                        )}`}
                      >
                        <option value="PENDING">Pending</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_VERIFICATION">Under Verification</option>
                        <option value="PAID_CLEARED">Paid/Cleared</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="REFUNDED">Refunded</option>
                      </select>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-sm">
                  <span className="font-medium">Doctor:</span> {apt.doctor ? `${apt.doctor.name} (${apt.doctor.specialization})` : 'Not assigned'}
                </p>
                {apt.hospital && (
                  <p className="text-sm">
                    <span className="font-medium">Hospital:</span> {apt.hospital}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Service:</span>{' '}
                  <span className="capitalize">{apt.serviceType}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Fee:</span> {apt.serviceFee} BDT
                </p>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">Payment</span>
                    <span className="text-gray-900 font-semibold">
                      {formatBDT((apt.amountPaid || 0) + (apt.remainingDue || 0))}
                      {' · '}
                      {formatBDT(apt.amountPaid || 0)} paid
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mt-0.5">
                    <span>Total: {formatBDT(apt.totalServiceCharge || 0)} BDT</span>
                    <span>
                      {paymentStatusLabel(apt.paymentStatus || 'UNPAID')}
                    </span>
                  </div>
                  <div className="mt-1">
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded-full font-medium ${paymentStatusColor(
                        apt.paymentStatus || 'UNPAID'
                      )}`}
                    >
                      {paymentStatusLabel(apt.paymentStatus || 'UNPAID')}
                    </span>
                    {apt.paymentMethod && (
                      <span className="ml-2 text-xs text-gray-500">
                        ({apt.paymentMethod})
                      </span>
                    )}
                  </div>
                </div>
                {apt.serialNo && (
                  <p className="text-sm">
                    <span className="font-medium">Serial:</span> {apt.serialNo}
                    {apt.serialTime ? ` · ${new Date(apt.serialTime).toLocaleString()}` : ''}
                  </p>
                )}
                {apt.status === 'completed' && apt.discountPercent != null && (
                  <p className="text-sm">
                    <span className="font-medium">Discount:</span>{' '}
                    <span className="text-green-600 font-semibold">
                      {apt.discountPercent}%
                    </span>
                  </p>
                )}
                {apt.patient && (
                  <p className="text-sm">
                    <span className="font-medium">Patient:</span> {apt.patient.name}
                  </p>
                )}
                {apt.agent && (
                  <p className="text-sm">
                    <span className="font-medium">Agent:</span> {apt.agent.name}
                  </p>
                )}
                {apt.taskStatus === 'IN_PROGRESS' && apt.taskStartedAt && (
                  <p className="text-sm">
                    <span className="font-medium">Task Started:</span>{' '}
                    {new Date(apt.taskStartedAt).toLocaleString()}
                  </p>
                )}
                {apt.taskStatus === 'IN_PROGRESS' && apt.taskId && (
                  <button
                    onClick={() => router.push(`/agent-dashboard/tasks/${apt.taskId}`)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Task Details →
                  </button>
                )}
                {apt.notes && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {apt.notes}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(apt)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(apt.id)}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                >
                  Delete
                </button>
                {apt.taskStatus === 'COMPLETED' && apt.taskId && (
                  <button
                    onClick={() => router.push(`/agents/ratings?taskId=${apt.taskId}`)}
                    className="flex-1 bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                  >
                    Rate Agent
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
