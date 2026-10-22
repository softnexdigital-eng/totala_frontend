export interface Patient {
  id: string;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  address?: string;
  isRegistered: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  fee: number;
  hospital?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  phone: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  patientId?: string;
  doctorId: string;
  agentId?: string;
  serviceTypeId?: string | null;
  date: string;
  status: 'pending' | 'confirmed' | 'received' | 'ongoing' | 'completed' | 'cancelled';
  serviceType: 'online' | 'package';
  serviceFee: number;
  totalServiceCharge: number;
  minRequiredPayment: number;
  amountPaid: number;
  remainingDue: number;
  /** UNPAID | PARTIALLY_PAID | PAID */
  paymentStatus: string;
  paymentMethod?: string | null;
  transactionId?: string | null;
  serialNo?: string | null;
  serialTime?: string | null;
  discountPercent?: number;
  discountAmount?: number;
  packagePrice?: number;
  packageDiscount?: number;
  packageFinalPrice?: number;
  notes?: string;
  whatsappNumber?: string;
  createdAt: string;
  updatedAt: string;
  patient?: Patient;
  doctor?: Doctor;
  agent?: Agent;
  package?: {
    id: string;
    name: string;
    finalPrice: number;
    discountPercent: number;
  };
  serviceTypeRef?: ServiceType | null;
  invoice?: Invoice;
}

export interface Test {
  id: string;
  appointmentId: string;
  testName: string;
  actualCost: number;
  discountPercent: number;
  finalCost: number;
  reportUrl?: string;
  prescriptionUrl?: string;
  receiptUrl?: string;
  status: 'pending' | 'done';
  uploadedAt?: string;
  createdAt: string;
  updatedAt: string;
  appointment: Appointment;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  whatsappNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error: string | null;
}

/** Public-facing agent profile shown on the landing page. */
export interface AgentProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  photo?: string;
  averageRating?: number;
  completedTasks?: number;
  area?: string;
  services?: string[];
  isActive?: boolean;
  /**
   * Service-charge freeze workflow: `true` when the agent has a task whose
   * payment was submitted but the Super Admin has not clicked "End" yet.
   * A frozen agent must NOT be bookable from the landing page cards.
   */
  isFrozen?: boolean;
  /** `!isFrozen` — convenience flag for the "Book Now" button state. */
  isBookable?: boolean;
  /** Number of tasks waiting for the Super Admin's "End" click. */
  pendingEndTasks?: number;
  createdAt?: string;
  updatedAt?: string;
}

/** A booking request submitted from the public landing page. */
export interface BookingRequest {
  id: string;
  patientId?: string;
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientGender?: string;
  patientAddress?: string;
  agentId?: string;
  agentName?: string;
  agent?: { id: string; name: string };
  serviceNeeded: string;
  serviceTypeId?: string | null;
  totalServiceCharge?: number;
  minRequiredPayment?: number;
  amountPaid?: number;
  remainingDue?: number;
  paymentStatus?: string;
  paymentMethod?: string | null;
  transactionId?: string | null;
  paymentVerified?: boolean;
  preferredDate?: string;
  preferredTime?: string;
  hospital?: string;
  bookingReason?: string;
  additionalNote?: string;
  serialNo?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

/** Payload submitted by the Book Now modal on the landing page. */
export interface AgentBookingPayload {
  agentId?: string;
  serviceNeeded?: string;
  preferredDate?: string;
  preferredTime?: string;
  hospital?: string;
  bookingReason?: string;
  additionalNote?: string;
  patient: {
    name: string;
    phone: string;
    age: string;
    gender?: string;
    address: string;
  };
}

export interface ServiceTypeSubField {
  id: string;
  serviceFieldId: string;
  name: string;
  value?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceTypeField {
  id: string;
  serviceTypeId: string;
  name: string;
  type: string;
  isRequired: boolean;
  options?: Record<string, unknown> | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  subFields: ServiceTypeSubField[];
}

export interface ServiceType {
  id: string;
  name: string;
  description?: string;
  serviceCharge: number;
  minRequiredPayment: number;
  /** available | unavailable */
  serviceAvailability: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  fields: ServiceTypeField[];
}

/** Invoice generated for an appointment. Amounts are snapshots. */
export interface Invoice {
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
  emailStatus: string; // PENDING | SENT | FAILED
  emailError?: string | null;
  emailSentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingFieldValue {
  fieldId: string;
  value: string | string[];
}

export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  brandName?: string;
  strength?: string;
  form?: string;
  medicineType: string;
  isActive: boolean;
  requiresPrescription: boolean;
  createdAt: string;
  updatedAt: string;
}
