'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { formatBDT, computeRemainingDue } from '@/lib/payments';

interface ServiceTypeOption {
  id: string;
  name: string;
  description?: string | null;
  serviceCharge: number;
  minRequiredPayment: number;
  serviceAvailability?: string;
  isActive: boolean;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);

  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    agentId: '',
    date: '',
    serviceType: 'online',
    serviceTypeId: '',
    totalServiceCharge: 0,
    minRequiredPayment: 0,
    initialPayment: 0,
    markPaid: false,
    markDue: true,
    notes: '',
    whatsappNumber: '',
    serialNo: '',
    serialTime: '',
  });

  // Load dropdown data (patients, doctors, agents, service types) on mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [patientsRes, doctorsRes, agentsRes, serviceTypesRes] = await Promise.all([
          fetch('/api/patients'),
          fetch('/api/doctors'),
          fetch('/api/agents'),
          fetch('/api/service-types'),
        ]);

        const patientsData = await patientsRes.json();
        const doctorsData = await doctorsRes.json();
        const agentsData = await agentsRes.json();
        const serviceTypesData = await serviceTypesRes.json();

        setPatients(patientsData.data || []);
        setDoctors(doctorsData.data || []);
        setAgents(agentsData.data || []);
        setServiceTypes(serviceTypesData.data || serviceTypesData || []);
      } catch (error) {
        toast.error('Failed to load appointment options');
      }
    };

    loadOptions();
  }, []);

  const selectedService = serviceTypes.find((s) => s.id === formData.serviceTypeId);

  /** When the admin picks a service type, load its configured pricing as defaults. */
  const handleServiceSelect = (serviceTypeId: string) => {
    const st = serviceTypes.find((s) => s.id === serviceTypeId);
    setFormData((prev) => ({
      ...prev,
      serviceTypeId,
      totalServiceCharge: st ? Number(st.serviceCharge) || 0 : prev.totalServiceCharge,
      minRequiredPayment: st ? Number(st.minRequiredPayment) || 0 : prev.minRequiredPayment,
    }));
  };

  const remainingAfterInitial = computeRemainingDue(
    formData.totalServiceCharge,
    formData.initialPayment
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation: minimum required payment must not exceed total charge.
    if (formData.totalServiceCharge > 0) {
      if (formData.minRequiredPayment > formData.totalServiceCharge) {
        toast.error('Minimum Required Payment must not exceed the total service charge');
        return;
      }
      if (formData.initialPayment < formData.minRequiredPayment) {
        toast.error(
          `Initial payment must be at least ${formatBDT(formData.minRequiredPayment)} before confirming`
        );
        return;
      }
      // Cannot mark fully paid when the total has not been received.
      if (formData.markPaid && formData.initialPayment < formData.totalServiceCharge) {
        toast.error('Cannot mark as Paid — the full service charge has not been received');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          agentId: formData.agentId || null,
          date: formData.date,
          serviceType: formData.serviceType,
          serviceTypeId: formData.serviceTypeId || null,
          totalServiceCharge: Number(formData.totalServiceCharge) || 0,
          minRequiredPayment: Number(formData.minRequiredPayment) || 0,
          initialPayment: Number(formData.initialPayment) || 0,
          notes: formData.notes,
          whatsappNumber: formData.whatsappNumber,
          serialNo: formData.serialNo.trim() || null,
          serialTime: formData.serialTime ? new Date(formData.serialTime).toISOString() : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(
          result.data?.invoice
            ? `Appointment created! Invoice ${result.data.invoice.invoiceNumber} generated.`
            : 'Appointment created successfully!'
        );
        router.push('/appointments');
      } else {
        toast.error(result.message || 'Failed to create appointment');
      }
    } catch (error) {
      toast.error('Something went wrong');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Appointment</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Patient
          </label>
          <select
            value={formData.patientId}
            onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Patient</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.phone})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doctor
          </label>
          <select
            value={formData.doctorId}
            onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select Doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} - {d.specialization}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Agent (Optional)
          </label>
          <select
            value={formData.agentId}
            onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">None</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date & Time
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
            value={formData.serviceType}
            onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="online">Online (50 BDT)</option>
            <option value="package">Package (500 BDT)</option>
          </select>
        </div>

        {/* Service Type (catalog) + Service Charge + Minimum Required Payment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Service (from catalog)
          </label>
          <select
            value={formData.serviceTypeId}
            onChange={(e) => handleServiceSelect(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Service (loads configured charge)</option>
            {serviceTypes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {formatBDT(s.serviceCharge)} (min {formatBDT(s.minRequiredPayment)})
              </option>
            ))}
          </select>
          {selectedService?.description && (
            <p className="mt-1 text-xs text-gray-500">{selectedService.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Service Charge (৳)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formData.totalServiceCharge}
              onChange={(e) =>
                setFormData({ ...formData, totalServiceCharge: Number(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Required Payment (৳) *
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formData.minRequiredPayment}
              onChange={(e) =>
                setFormData({ ...formData, minRequiredPayment: Number(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={formData.totalServiceCharge > 0}
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Payment (৳)
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={formData.initialPayment}
              onChange={(e) =>
                setFormData({ ...formData, initialPayment: Number(e.target.value) || 0 })
              }
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining Due after initial payment</span>
            <span className="font-semibold">{formatBDT(remainingAfterInitial)}</span>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.markPaid}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    markPaid: e.target.checked,
                    markDue: e.target.checked ? false : formData.markDue,
                  })
                }
                className="h-4 w-4"
              />
              Paid
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.markDue}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    markDue: e.target.checked,
                    markPaid: e.target.checked ? false : formData.markPaid,
                  })
                }
                className="h-4 w-4"
              />
              Due
            </label>
          </div>
          <p className="text-xs text-gray-500">
            Payment status is calculated server-side from recorded amounts. An invoice is
            generated automatically on creation.
          </p>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Number
          </label>
          <input
            type="text"
            value={formData.whatsappNumber}
            onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create Appointment'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
