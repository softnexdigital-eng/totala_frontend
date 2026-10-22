/**
 * Shared payment status helpers + formatting used across appointment details,
 * invoices and agent task cards so payment info reads consistently everywhere.
 */

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'DUE';

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  DUE: 'Due',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-gray-100 text-gray-800',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  DUE: 'bg-red-100 text-red-800',
};

/** ৳ with thousands separators. */
export const formatBDT = (amount: number | null | undefined): string => {
  const n = Number(amount) || 0;
  return `৳${n.toLocaleString('en-BD')}`;
};

export const paymentStatusLabel = (status?: string | null): string =>
  PAYMENT_STATUS_LABELS[status || 'UNPAID'] || 'Unpaid';

export const paymentStatusColor = (status?: string | null): string =>
  PAYMENT_STATUS_COLORS[status || 'UNPAID'] || 'bg-gray-100 text-gray-800';

/**
 * Client-side mirror of the backend calc for live display only.
 * The authoritative calculation always happens on the server.
 */
export const computeRemainingDue = (
  totalServiceCharge: number,
  amountPaid: number,
): number => {
  const due = (Number(totalServiceCharge) || 0) - (Number(amountPaid) || 0);
  return due > 0 ? due : 0;
};

export const computePaymentStatus = (
  totalServiceCharge: number,
  amountPaid: number,
): PaymentStatus => {
  const total = Number(totalServiceCharge) || 0;
  const paid = Number(amountPaid) || 0;
  if (paid <= 0) return 'UNPAID';
  if (paid >= total && total > 0) return 'PAID';
  return 'PARTIALLY_PAID';
};
