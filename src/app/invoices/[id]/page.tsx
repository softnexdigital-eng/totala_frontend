'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  appointmentId: string;
  patientName: string;
  patientContact?: string | null;
  serviceType: string;
  serviceDescription?: string | null;
  totalServiceCharge: number;
  minRequiredPayment: number;
  amountPaid: number;
  remainingDue: number;
  paymentStatus: string;
  paymentMethod?: string | null;
  transactionId?: string | null;
  appointmentDate?: string | null;
  emailStatus: string;
  emailSentAt?: string | null;
  createdAt: string;
}

const statusColor = (s: string) => {
  if (s === 'PAID' || s === 'SENT') return 'text-green-700 bg-green-50 border-green-200';
  if (s === 'PARTIALLY_PAID') return 'text-amber-700 bg-amber-50 border-amber-200';
  if (s === 'FAILED') return 'text-red-700 bg-red-50 border-red-200';
  return 'text-slate-600 bg-slate-50 border-slate-200';
};

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params?.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!appointmentId) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/invoices/${appointmentId}`);
        const json = await res.json();
        if (json.success) setInvoice(json.data);
        else toast.error(json.message || 'Invoice not found');
      } catch {
        toast.error('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId]);

  const retryEmail = async () => {
    if (!invoice) return;
    setSending(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/email`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        toast.success('Invoice email sent');
        setInvoice(json.data);
      } else {
        toast.error(json.message || 'Failed to send email');
      }
    } catch {
      toast.error('Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="p-6">Loading invoice…</div>;
  if (!invoice) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <p className="text-gray-600">Invoice not found for this appointment.</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Go back</button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Invoice {invoice.invoiceNumber}</h1>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Print / PDF
          </button>
          <button onClick={retryEmail} disabled={sending} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50">
            {sending ? 'Sending…' : invoice.emailStatus === 'SENT' ? 'Resend Email' : 'Send Email'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8 space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-xl font-bold text-blue-700">Dakdin</h2>
          <p className="text-sm text-gray-500">Healthcare Services · Invoice Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Patient</div>
            <div className="font-medium">{invoice.patientName}</div>
            {invoice.patientContact && <div className="text-gray-600">{invoice.patientContact}</div>}
          </div>
          <div>
            <div className="text-gray-500">Appointment</div>
            <div className="font-medium">{invoice.appointmentDate ? new Date(invoice.appointmentDate).toLocaleString() : '—'}</div>
            <div className="text-gray-500 text-xs">ID: {invoice.appointmentId}</div>
          </div>
        </div>

        <table className="w-full text-sm border-t">
          <tbody>
            <tr className="border-b"><td className="py-2 text-gray-600">Service Type</td><td className="py-2 text-right font-medium">{invoice.serviceType}</td></tr>
            <tr className="border-b"><td className="py-2 text-gray-600">Total Service Charge</td><td className="py-2 text-right font-medium">৳{invoice.totalServiceCharge.toLocaleString()}</td></tr>
            <tr className="border-b"><td className="py-2 text-gray-600">Minimum Required Payment</td><td className="py-2 text-right">৳{invoice.minRequiredPayment.toLocaleString()}</td></tr>
            <tr className="border-b"><td className="py-2 text-gray-600">Amount Paid</td><td className="py-2 text-right text-green-700 font-medium">৳{invoice.amountPaid.toLocaleString()}</td></tr>
            <tr className="border-b"><td className="py-2 text-gray-600">Remaining Due</td><td className="py-2 text-right text-red-600 font-medium">৳{invoice.remainingDue.toLocaleString()}</td></tr>
            {invoice.paymentMethod && <tr className="border-b"><td className="py-2 text-gray-600">Payment Method</td><td className="py-2 text-right">{invoice.paymentMethod}</td></tr>}
            {invoice.transactionId && <tr className="border-b"><td className="py-2 text-gray-600">Transaction ID</td><td className="py-2 text-right font-mono text-xs">{invoice.transactionId}</td></tr>}
          </tbody>
        </table>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Payment Status:</span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor(invoice.paymentStatus)}`}>
            {invoice.paymentStatus.replace('_', ' ')}
          </span>
          <span className={`text-xs px-2.5 py-1 rounded-full border ${statusColor(invoice.emailStatus)}`}>
            Email: {invoice.emailStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
