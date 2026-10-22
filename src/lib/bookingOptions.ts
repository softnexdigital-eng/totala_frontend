/**
 * Domain constants & helpers for the Agent Booking Request flow.
 *
 * Statuses are sent to / displayed from the backend `bookings` resource.
 * The user-facing labels below (Pending / Confirmed / Rejected /
 * Cancelled / Completed) are mapped onto the backend's existing status
 * enum (PENDING / APPROVED / REJECTED / CANCELLED / COMPLETED) so updates
 * stay compatible with the existing Online Bookings workflow.
 */

export const SERVICE_NEEDED_OPTIONS: { value: string; label: string }[] = [];

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  serviceCharge?: number;
  minRequiredPayment?: number;
  serviceAvailability?: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  fields: {
    id: string;
    serviceTypeId: string;
    name: string;
    type: string;
    isRequired: boolean;
    options?: Record<string, unknown> | null;
    order: number;
    createdAt: string;
    updatedAt: string;
    subFields: {
      id: string;
      serviceFieldId: string;
      name: string;
      value?: string;
      order: number;
      createdAt: string;
      updatedAt: string;
    }[];
  }[];
}

export const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

// value = what we send to the backend (keeps the existing booking enum intact)
export const BOOKING_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Confirmed' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' },
];

const BOOKING_STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Confirmed',
  ASSIGNED: 'Confirmed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
  pending: 'Pending',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const BOOKING_STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  REJECTED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-green-100 text-green-800',
};

export function getBookingStatusLabel(status?: string): string {
  if (!status) return 'Pending';
  return BOOKING_STATUS_LABEL[status] ?? status;
}

export function getBookingStatusColor(status?: string): string {
  if (!status) return 'bg-gray-100 text-gray-800';
  return BOOKING_STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-800';
}

export function formatDateTime(value?: string | null, fallback = '-'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(value?: string | null, fallback = '-'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatTime(value?: string | null, fallback = '-'): string {
  if (!value) return fallback;
  return value;
}