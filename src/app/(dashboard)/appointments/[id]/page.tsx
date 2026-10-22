import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchBackendJson } from '../../../../lib/api';
import { getAuthToken } from '@/lib/serverAuth';
import { getStatusLabel, getStatusColor } from '../../../../lib/appointmentStatus';
import { formatBDT, paymentStatusColor, paymentStatusLabel } from '@/lib/payments';

interface Appointment {
  id: string;
  patient: { id: string; name: string; phone?: string; email?: string };
  doctor?: { id: string; name: string };
  agent?: { name: string };
  date: string;
  status: string;
  serviceType: string;
  serviceFee: number;
  totalServiceCharge?: number;
  minRequiredPayment?: number;
  amountPaid?: number;
  remainingDue?: number;
  paymentStatus?: string;
  paymentMethod?: string | null;
  transactionId?: string | null;
  invoice?: {
    invoiceNumber: string;
    amountPaid: number;
    remainingDue: number;
    paymentStatus: string;
    emailStatus: string;
  } | null;
  discountPercent?: number;
  serialNo?: string | null;
  serialTime?: string | null;
  notes?: string;
}

async function getAppointment(id: string) {
  const token = await getAuthToken();
  return fetchBackendJson(`/api/appointments/${id}`, token);
}

export default async function AppointmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getAppointment(params.id);

  if (!data || !data.success) {
    notFound();
  }

  const appointment: Appointment = data.data;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Appointment Details</h1>
        <Link href="/appointments" className="text-blue-600 hover:text-blue-800">
          Back to List
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Patient</label>
          <p className="text-lg">{appointment.patient.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">Doctor</label>
          <p className="text-lg">{appointment.doctor ? appointment.doctor.name : 'Not assigned'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">Date & Time</label>
          <p className="text-lg">{new Date(appointment.date).toLocaleString()}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">Service Type</label>
          <p className="text-lg capitalize">{appointment.serviceType}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">Service Fee</label>
          <p className="text-lg">{appointment.serviceFee} BDT</p>
        </div>

        {/* Payment summary — mirrors invoice + agent task card values */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Payment</span>
            <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${paymentStatusColor(appointment.paymentStatus)}`}>
              {paymentStatusLabel(appointment.paymentStatus)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Service Charge</span>
            <span className="font-semibold">{formatBDT(appointment.totalServiceCharge ?? appointment.serviceFee)}</span>
          </div>
          {appointment.minRequiredPayment ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Minimum Required Payment</span>
              <span className="font-semibold">{formatBDT(appointment.minRequiredPayment)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount Paid</span>
            <span className="font-semibold text-emerald-700">{formatBDT(appointment.amountPaid)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining Due</span>
            <span className="font-semibold text-rose-600">{formatBDT(appointment.remainingDue)}</span>
          </div>
          {appointment.paymentMethod ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-medium capitalize">{appointment.paymentMethod}</span>
            </div>
          ) : null}
          {appointment.transactionId ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-mono text-xs">{appointment.transactionId}</span>
            </div>
          ) : null}
          {appointment.invoice ? (
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div className="text-xs text-gray-600">
                <div><span className="font-medium">Invoice:</span> {appointment.invoice.invoiceNumber}</div>
                <div className="text-gray-400">Email: {appointment.invoice.emailStatus}</div>
              </div>
              <Link
                href={`/invoices/${appointment.id}`}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                View / Print Invoice
              </Link>
            </div>
          ) : null}
        </div>

        {appointment.status === 'completed' && appointment.discountPercent != null && (
          <div>
            <label className="block text-sm font-medium text-gray-500">Discount Given</label>
            <p className="text-lg text-green-600">{appointment.discountPercent}%</p>
          </div>
        )}

        {appointment.serialNo && (
          <div>
            <label className="block text-sm font-medium text-gray-500">Serial Number</label>
            <p className="text-lg">
              {appointment.serialNo}
              {appointment.serialTime ? ` · ${new Date(appointment.serialTime).toLocaleString()}` : ''}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-500">Status</label>
          <span
            className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(
              appointment.status
            )}`}
          >
            {getStatusLabel(appointment.status)}
          </span>
        </div>

        {appointment.agent && (
          <div>
            <label className="block text-sm font-medium text-gray-500">Agent</label>
            <p className="text-lg">{appointment.agent.name}</p>
          </div>
        )}

        {appointment.notes && (
          <div>
            <label className="block text-sm font-medium text-gray-500">Notes</label>
            <p className="text-lg">{appointment.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
