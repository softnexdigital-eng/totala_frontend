'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Calendar, Clock, MapPin, Stethoscope, ShieldCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { validateEmail, validateOTP, validatePhone } from '@/lib/validation';
import { trackLead, getFingerprint } from '@/lib/antiFraud';
import { useBookingOtp } from '@/components/booking/useBookingOtp';
import { GENDER_OPTIONS, type ServiceType } from '@/lib/bookingOptions';
import { formatBDT } from '@/lib/payments';
import type { AgentProfile } from '@/types';
import type { Medicine } from '@/types';

interface BookNowModalProps {
  /**
   * Booking agent the request is booked with. Optional: when omitted (landing
   * page search bar flow) no agent is selected — the Super Admin reviews the
   * request and assigns an agent from the dashboard, exactly as before.
   */
  agent?: AgentProfile | null;
  onClose: () => void;
  onSubmitted?: () => void;
  /** Service type pre-selected by the landing page search bar dropdown. */
  initialService?: string;
  /**
   * Doctor pre-selected by the landing page "Online Doctors" section. When the
   * visitor clicks a doctor card, the booking form opens with that doctor
   * already chosen (id + name), so the submitted booking keeps the link to
   * the real doctor record instead of free text.
   */
  initialDoctor?: { id: string; name: string } | null;
}

/** Landing page freeze rule: a frozen agent cannot be booked at all. */
const isAgentFrozen = (agent: AgentProfile | null) =>
  !!agent && (agent.isFrozen === true || agent.isBookable === false);

/**
 * Maps the Bengali service labels used on the landing page to the English
 * service-type names stored in the database, so a landing-page selection can
 * be resolved into a real `serviceTypeId` (needed for pricing + doctor field).
 */
const SERVICE_NAME_ALIASES: Record<string, string> = {
  'ডাক্তার অ্যাপয়েন্টমেন্ট': 'Online Consultation / Doctor Booking',
  'ডাক্তার অ্যাপয়েন্টমেন্ট সহায়তা': 'Doctor Appointment with Patient Assistance',
  'ডাক্তার অ্যাপয়েন্টমেন্ট এসিস্ট্যান্স': 'Doctor Appointment',
  'অনলাইন ডাক্তার': 'Online Consultation / Doctor Booking',
  'ডাক্তার বুকিং': 'Online Consultation / Doctor Booking',
  'ডাক্তার / চিকিৎসা': 'Online Consultation / Doctor Booking',
  'ওষুধ সংগ্রহ': 'Medicine Collection',
  'ঔষধ / ফার্মেসি': 'Medicine Collection',
  'রিপোর্ট সংগ্রহ': 'Report Collection',
  'রক্ত সংগ্রহ': 'Blood Collection',
  'স্যালাইন / আইভি': 'Saline Push / IV Support',
  'ইনজেকশন প্রদান': 'Injection Administration',
  'ড্রেসিং / ক্ষত পরিচর্যা': 'Blood Pressure Check - Dressing / Wound Care',
};

/**
 * Keyword synonyms used when a landing-page label has no exact alias entry:
 * the Bengali label is translated into an English keyword and matched against
 * the service-type names. Keeps the doctor services resolvable even when the
 * seeded service names differ slightly from the alias targets.
 */
const SERVICE_KEYWORD_SYNONYMS: { keywords: string[]; match: string[] }[] = [
  { keywords: ['ডাক্তার', 'চিকিৎসা'], match: ['doctor', 'consultation'] },
  { keywords: ['ওষুধ', 'ঔষধ', 'ফার্মেসি'], match: ['medicine', 'pharmacy'] },
  { keywords: ['রিপোর্ট'], match: ['report'] },
  { keywords: ['রক্ত'], match: ['blood'] },
  { keywords: ['স্যালাইন'], match: ['saline', 'iv'] },
  { keywords: ['ইনজেকশন'], match: ['injection'] },
  { keywords: ['ড্রেসিং', 'ক্ষত'], match: ['dressing', 'wound'] },
];

interface FormErrors {
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientAge?: string;
  patientAddress?: string;
  serviceNeeded?: string;
  bookingReason?: string;
  otp?: string;
  medicineName?: string;
  quantity?: string;
}

interface HospitalOption {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface DoctorOption {
  id: string;
  name: string;
  title?: string;
  specialization?: string;
  fee?: number | null;
  hospital?: string;
  isActive: boolean;
  registrationStatus?: string;
}

export default function BookNowModal({
  agent,
  onClose,
  onSubmitted,
  initialService,
  initialDoctor,
}: BookNowModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [hospitals, setHospitals] = useState<HospitalOption[]>([]);
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [serviceTypesLoading, setServiceTypesLoading] = useState(true);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [doctorsLoading, setDoctorsLoading] = useState(true);

  const [form, setForm] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAge: '',
    patientGender: '',
    patientAddress: '',
    serviceNeeded: initialService || '',
    preferredDate: '',
    preferredTime: '',
    hospital: '',
    bookingReason: '',
    additionalNote: '',
    doctorId: initialDoctor?.id || '',
    doctorName: initialDoctor?.name || '',
  });

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [medicineName, setMedicineName] = useState('');
  const [medicineStrength, setMedicineStrength] = useState('');
  const [medicineForm, setMedicineForm] = useState('Tablet');
  const [medicineQuantity, setMedicineQuantity] = useState(1);
  const [prescription, setPrescription] = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [prescriptionDoctorName, setPrescriptionDoctorName] = useState('');
  const [doctorRegNo, setDoctorRegNo] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState('');
  const [hospitalName, setHospitalName] = useState('');

  /* ---------------------------------------------------------- anti-fraud -- */
  // Email-OTP gate (request -> verify -> bookingToken) + idempotency/bot-trap
  // values the backend requires on create.
  const {
    step,
    setStep,
    otp,
    setOtp,
    sendingOtp,
    verifying,
    bookingToken,
    requestOtp,
    verifyOtp,
    resetToken,
    formOpenedAt,
    idempotencyKey,
  } = useBookingOtp();
  // Honeypot: real visitors never see/fill this; bots that do get auto-blocked
  // server-side (backend also rejects submits <3s after formOpenedAt).
  const [honeypot, setHoneypot] = useState('');

  /* ---------------- Test-mode payment (no gateway verification) --------------- */
  // In test mode, a single "Pay" button click marks the booking as paid.
  // No bKash gateway, no authorization — will integrate real sandbox API later.
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  // Half-form tracker: fire once per field on blur (never blocks the UI).
  const trackedFields = useRef<Set<string>>(new Set());
  // Single-use token guard: double Enter / StrictMode double-invoke would
  // replay the token and get flagged as suspicious (403, no booking stored).
  const submitInflight = useRef(false);
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await fetch('/api/public/hospitals');
        const json = await res.json();
        if (json.success) {
          setHospitals(json.data || []);
        }
      } catch {
        // silently ignore - dropdown will just be empty
      } finally {
        setHospitalsLoading(false);
      }
    };

    fetchHospitals();
  }, []);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        // Public route: the regular /api/service-types endpoint requires a
        // super-admin session, which an anonymous visitor does not have.
        const res = await fetch('/api/public/service-types');
        const json = await res.json();
        if (json.success) {
          const activeTypes = (json.data || []).filter((st: ServiceType) => st.isActive);
          setServiceTypes(activeTypes);
        }
      } catch {
        // silently ignore
      } finally {
        setServiceTypesLoading(false);
      }
    };

    fetchServiceTypes();
  }, []);

  /**
   * Resolve a service NAME (passed by the landing page, e.g. "ডাক্তার অ্যাপয়েন্টমেন্ট")
   * into the real service-type id once the public service-type list arrives.
   * Without this the pricing snapshot and the doctor selector cannot work,
   * because the backend books on `serviceTypeId`, not on a free-text name.
   */
  useEffect(() => {
    if (serviceTypesLoading || serviceTypes.length === 0) return;
    const current = (form.serviceNeeded || '').trim();
    if (!current) return;
    // Already an id → nothing to resolve.
    if (serviceTypes.some((s) => s.id === current)) return;
    const match =
      serviceTypes.find((s) => s.id === current) ||
      serviceTypes.find((s) => s.name === current) ||
      serviceTypes.find(
        (s) => s.name.toLowerCase() === current.toLowerCase()
      ) ||
      // Alias map: the landing page uses Bengali labels while the service types
      // are stored in English. Each alias points at the matching service name.
      (() => {
        const alias = SERVICE_NAME_ALIASES[current.toLowerCase()];
        if (!alias) return undefined;
        return (
          serviceTypes.find((s) => s.name.toLowerCase() === alias) ||
          serviceTypes.find((s) => s.name.toLowerCase().includes(alias))
        );
      })() ||
      // Keyword synonyms (Bengali label → English service name).
      (() => {
        const rule = SERVICE_KEYWORD_SYNONYMS.find((r) =>
          r.keywords.some((kw) => current.includes(kw))
        );
        if (!rule) return undefined;
        return serviceTypes.find((s) =>
          rule.match.some((m) => s.name.toLowerCase().includes(m))
        );
      })();
    if (match) update('serviceNeeded', match.id);
  }, [serviceTypes, serviceTypesLoading]);

  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const res = await fetch('/api/medicines');
        const json = await res.json();
        if (json.success) {
          setMedicines(json.data || []);
        }
      } catch {
        // silently ignore
      }
    };

    fetchMedicines();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await fetch('/api/public/doctors');
        const json = await res.json();
        if (json.success) {
          setDoctors(json.data || []);
        }
      } catch {
        // silently ignore - the doctor selector will just be empty
      } finally {
        setDoctorsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  /**
   * Editable doctor combobox behaviour: a doctor can be picked from the list
   * (which resolves form.doctorId) or typed/overridden as free text (which
   * clears form.doctorId so the visitor's wording is preserved as doctorName).
   */
  const handleDoctorChange = (value: string) => {
    update('doctorName', value);
    const match = doctors.find(
      (d) => d.isActive && d.name.toLowerCase() === value.trim().toLowerCase()
    );
    update('doctorId', match ? match.id : '');
  };

  const update = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  /* Pricing snapshot of the selected service → mandatory initial payment. */
  const selectedServiceType = serviceTypes.find(
    (s) => s.id === form.serviceNeeded || s.name === form.serviceNeeded
  );
const bookingCharge = Number(selectedServiceType?.serviceCharge) || 0;
const bookingMinPayment = Math.ceil(bookingCharge / 2); // half payment
const bookingDueAfter = Math.max(0, bookingCharge - (paidAmount || 0));
const paymentRequired = bookingCharge > 0;

  const handleServiceChange = (value: string) => {
    update('serviceNeeded', value);
    // New service = new price: reset the payment verification.
    setPaymentMethod('bkash');
    setTransactionId('');
    setPaymentVerified(false);
    setPaidAmount(0);
    hasAutoSubmitted.current = false;
  };

  const serviceNeededLower = (form.serviceNeeded || '').toLowerCase();
  const isMedicineService =
    serviceNeededLower.includes('medicine') ||
    serviceNeededLower.includes('prescription') ||
    serviceNeededLower.includes('prescription medicine') ||
    serviceNeededLower.includes('ওষুধ') ||
    serviceNeededLower.includes('ফার্মেসি') ||
    serviceNeededLower.includes('প্রেসক্রিপশন');
  const isPrescriptionService = isMedicineService;

  const doctorAppointmentNames = ['Doctor Appointment with Patient Assistance', 'Doctor Appointment'];
  // Any service that involves a doctor should expose the doctor picker:
  // the seeded service types include "Online Consultation / Doctor Booking"
  // and the landing page also links in with the Bengali label.
  const doctorServiceKeywords = [
    'doctor appointment',
    'doctor booking',
    'online consultation',
    'ডাক্তার',
  ];
  const isDoctorAppointment = selectedServiceType
    ? doctorAppointmentNames.includes(selectedServiceType.name) ||
      doctorServiceKeywords.some((kw) =>
        selectedServiceType.name.toLowerCase().includes(kw)
      )
    : false;

  const handlePrescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setPrescription(file);
    if (file) {
      setPrescriptionPreview(URL.createObjectURL(file));
    } else {
      setPrescriptionPreview(null);
    }
  };

  /**
   * Freeze guard: when the agent's previous task service charge is submitted
   * and the Super Admin has not clicked "End" yet, the booking form stays
   * closed for that agent (backend also rejects it with HTTP 423).
   */
  const frozen = isAgentFrozen(agent ?? null);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!form.patientName.trim()) newErrors.patientName = 'Patient name is required';
    if (!form.patientPhone.trim()) newErrors.patientPhone = 'Phone number is required';
    else if (!validatePhone(form.patientPhone))
      newErrors.patientPhone = 'Enter a valid phone number';
    if (!form.patientEmail.trim()) newErrors.patientEmail = 'Email is required (for OTP verification)';
    else if (!validateEmail(form.patientEmail))
      newErrors.patientEmail = 'Enter a valid email address';
    if (!form.patientAge.trim()) newErrors.patientAge = 'Age is required';
    else if (Number(form.patientAge) <= 0) newErrors.patientAge = 'Enter a valid age';
    if (!form.patientAddress.trim()) newErrors.patientAddress = 'Address is required';
    if (!form.serviceNeeded) newErrors.serviceNeeded = 'Service needed is required';
    if (!form.bookingReason.trim())
      newErrors.bookingReason = 'Booking reason / service details is required';
    if (isMedicineService && !medicineName.trim()) {
      newErrors.medicineName = 'Medicine name is required';
    }
    if (isMedicineService && medicineQuantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }
    if (isPrescriptionService && !prescription) {
      toast.error('Prescription upload is required for prescription/assistance orders');
      return false;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Half-form / drop-off tracker: fires once per field on blur so the admin
   * Security dashboard can see exactly where visitors abandon the form.
   * Fire-and-forget — never blocks or fails the booking UX.
   */
  const trackFieldBlur = (fieldName: string) => {
    if (trackedFields.current.has(fieldName)) return;
    trackedFields.current.add(fieldName);
    trackLead({
      fieldName,
      formStage: 'typing',
      name: form.patientName || undefined,
      phone: form.patientPhone || undefined,
      email: form.patientEmail || undefined,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (frozen) {
      toast.error(
        'এই এজেন্ট এখন freeze আছে — সুপার অ্যাডমিন আগের টাস্ক End করলে বুকিং চালু হবে'
      );
      return;
    }
    if (!validate()) return;

    // Mandatory payment gate: when the service charges, the bKash gateway must
    // have confirmed a successful initial payment before submitting.
    if (paymentRequired && !paymentVerified) {
      toast.error(
        `Please complete the required initial payment of ${formatBDT(bookingMinPayment)} before submitting`
      );
      return;
    }

    // When bKash payment is verified, skip OTP and create the booking directly.
    if (!bookingToken && paymentVerified) {
      toast.loading('Creating your booking…', { id: 'booking-submit' });
      await submitBooking('');
      return;
    }

    // Anti-fraud step 1: no bookingToken yet — email the OTP first and move
    // to the verification screen. The booking is only created after verify.
    if (!bookingToken) {
      trackLead({
        fieldName: 'formSubmit',
        formStage: 'otpRequested',
        name: form.patientName || undefined,
        phone: form.patientPhone || undefined,
        email: form.patientEmail || undefined,
      });
      await requestOtp(form.patientEmail.trim());
      return;
    }

    await submitBooking(bookingToken);
  };

  // // Auto-submit booking after bKash payment is verified.
  // useEffect(() => {
  //   if (paymentVerified && !bookingToken && !submitInflight.current && !loading && !hasAutoSubmitted.current) {
  //     hasAutoSubmitted.current = true;
  //     toast.loading('Creating your booking…', { id: 'booking-submit' });
  //     void submitBooking('');
  //   }
  // }, [paymentVerified, bookingToken, loading]);

  /**
   * Anti-fraud step 2: verify the OTP, then create the booking with the
   * freshly issued (single-use) bookingToken.
   */
  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || verifying) return; // double Enter / double tap guard: token is single-use
    if (!validateOTP(otp)) {
      setErrors((prev) => ({ ...prev, otp: 'Enter the 6-digit OTP from your email' }));
      return;
    }
    setErrors((prev) => ({ ...prev, otp: undefined }));
    const token = await verifyOtp(form.patientEmail.trim());
    if (!token) return;
    await submitBooking(token);
  };

  /** Final step: create the booking with token + idempotency + bot-trap fields.
   *  Guarded against double-invoke: the bookingToken is single-use, so a
   *  second submit with the same token is flagged as suspicious (403) by the
   *  backend and no booking is stored. */
  const submitBooking = async (token: string) => {
    if (submitInflight.current) return;
    submitInflight.current = true;
    setLoading(true);
    try {
      const response = await fetch('/api/public/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-fingerprint': getFingerprint() },
        body: JSON.stringify({
          agentId: agent?.id || null,
          serviceNeeded: form.serviceNeeded,
          serviceTypeId: selectedServiceType?.id || null,
          totalServiceCharge: bookingCharge,
          minRequiredPayment: bookingMinPayment,
          amountPaid: paidAmount || 0,
          paymentMethod: paymentMethod || null,
          transactionId: transactionId || null,
          paymentVerified,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
          hospital: form.hospital || undefined,
          doctorId: form.doctorId || null,
          doctorName: form.doctorName || null,
          bookingReason: form.bookingReason,
          additionalNote: form.additionalNote,
          patient: {
            name: form.patientName,
            phone: form.patientPhone,
            email: form.patientEmail.trim().toLowerCase(),
            age: form.patientAge,
            gender: form.patientGender,
            address: form.patientAddress,
          },
          medicine: isMedicineService
            ? {
                name: medicineName,
                strength: medicineStrength,
                form: medicineForm,
                quantity: medicineQuantity,
                prescription: prescription
                  ? {
                      file: prescription.name,
                      doctorName: prescriptionDoctorName,
                      doctorRegistrationNumber: doctorRegNo,
                      prescriptionDate,
                      hospitalName,
                    }
                  : null,
              }
            : null,
          bookingToken: token,
          idempotencyKey: idempotencyKey.current,
          formOpenedAt: formOpenedAt.current,
          fingerprint: getFingerprint(),
          company_name: honeypot,
        }),
      });
      const result = await response.json();
      if (result.success) {
        trackLead({
          fieldName: 'formSubmit',
          formStage: 'completed',
          name: form.patientName || undefined,
          phone: form.patientPhone || undefined,
          email: form.patientEmail || undefined,
        });
        toast.success(result.message || 'Booking request submitted successfully!', { id: 'booking-submit' });
        if (result.data?.autoCreatedPatient) {
          toast('A new patient profile was created automatically', { icon: '🆕' });
        } else if (result.data?.patient?.id) {
          toast('Linked to your existing patient profile', { icon: '🔗' });
        }
        onSubmitted?.();
        onClose();
      } else {
        toast.error(result.message || 'Failed to submit booking request', { id: 'booking-submit' });
        // Token expired / already consumed / email mismatch / flagged as
        // suspicious (single-use token replayed, e.g. double submit) — back
        // to the form so the visitor can request a fresh OTP.
        if (response.status === 401 || response.status === 400 || response.status === 403) {
          resetToken();
        }
        // The blocked IP/fingerprint must not keep retrying with the same
        // idempotency key — that looks like a replay attack to the backend.
        if (response.status === 403 || response.status === 429) {
          idempotencyKey.current = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.', { id: 'booking-submit' });
    } finally {
      submitInflight.current = false;
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Compact "social app" design tokens (Facebook-like sizing).          */
  /* Fields: 40px high, 15px text, 6px radius, thin gray border.         */
  /* Labels: 13px semibold. Buttons: 40px high, 15px text.               */
  /* ------------------------------------------------------------------ */
  const fieldBase =
    'block w-full min-w-0 max-w-full appearance-none rounded-md border bg-white px-3 text-[15px] text-gray-900 outline-none transition placeholder:text-gray-400 sm:text-sm';
  const fieldOk = 'border-gray-300 focus:border-green-600 focus:ring-1 focus:ring-green-600';
  const fieldBad = 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500';
  const inputCls = `${fieldBase} h-10 sm:h-10 ${fieldOk}`;
  const inputErr = `${fieldBase} h-10 sm:h-10 ${fieldBad}`;
  const areaCls = `${fieldBase} resize-none py-2 ${fieldOk}`;
  const areaErr = `${fieldBase} resize-none py-2 ${fieldBad}`;
  const selectCls = `${inputCls} cursor-pointer pr-8 bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2214%22 height=%2214%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7280%22 stroke-width=%222.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_0.6rem_center]`;
  const labelCls = 'mb-1 block text-[13px] font-semibold text-gray-600';
  const errCls = 'mt-1 text-xs text-red-600';
  const cardCls = 'rounded-lg bg-white p-3 shadow-sm ring-1 ring-black/5 sm:p-4';
  const cardTitleCls = 'mb-3 flex items-center gap-2 text-[15px] font-bold text-gray-900';
  const iconBubble =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600';

  // Lock background scroll + close on Escape while the modal is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    // Mobile: full-screen sheet. Desktop (sm+): centered card with backdrop.
    <div className="fixed inset-0 z-50 bg-black/50 sm:overflow-y-auto sm:p-4">
      <div className="relative mx-auto flex h-[100dvh] w-full flex-col overflow-hidden bg-gray-100 shadow-2xl sm:my-8 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:max-w-xl sm:rounded-xl">
        {/* Header: white bar, small bold title, gray round close button */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 pb-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] sm:px-4 sm:py-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[17px] font-bold leading-tight text-gray-900">
              {agent?.name ? `Book with ${agent.name}` : 'Booking Request'}
            </h2>
            <Link
              href="/medicine-booking"
              className="text-xs font-medium text-green-600 hover:underline"
              onClick={onClose}
            >
              Book Medicine Online
            </Link>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300 active:bg-gray-300"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={step === 'otp' ? handleVerifyAndSubmit : handleSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="relative min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:p-4">

          {frozen && (
            <div className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-slate-700">
              <p className="font-bold text-slate-900">This agent is frozen</p>
              <p className="mt-0.5">
                আগের টাস্কের সার্ভিস চার্জ পেমেন্ট জমা হয়েছে, কিন্তু সুপার অ্যাডমিন
                এখনো End করেননি। তাই এই এজেন্টের জন্য নতুন বুকিং নেওয়া যাবে না।
              </p>
            </div>
          )}
          {/* Honeypot — invisible to humans; bots that fill it get blocked. */}
          <div
            className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
            aria-hidden="true"
          >
            <label>
              Company Name
              <input
                type="text"
                name="company_name"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </label>
          </div>

          {step === 'otp' ? (
            /* ---------- Step 2: email OTP verification ---------- */
            <div className={cardCls}>
              <h3 className={cardTitleCls}>
                <span className={iconBubble}>
                  <ShieldCheck className="h-4 w-4" />
                </span>
                Verify your email
              </h3>
              <p className="break-words text-[13px] leading-relaxed text-gray-600">
                We sent a 6-digit OTP to{' '}
                <span className="break-all font-semibold text-gray-900">{form.patientEmail}</span>.
                Enter it below to confirm your booking request.
              </p>

              <label className={`${labelCls} mt-4`}>
                Email OTP *
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }));
                }}
                className={`text-center text-xl font-semibold tracking-[0.4em] ${
                  errors.otp ? inputErr : inputCls
                } !h-12`}
                placeholder="••••••"
                autoFocus
              />
              {errors.otp && <p className={errCls}>{errors.otp}</p>}

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1">
                <button
                  type="button"
                  onClick={() => requestOtp(form.patientEmail.trim())}
                  disabled={sendingOtp}
                  className="py-1.5 text-[13px] font-semibold text-green-600 hover:underline disabled:opacity-50"
                >
                  {sendingOtp ? 'Sending…' : 'Resend OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="py-1.5 text-[13px] font-semibold text-gray-500 hover:underline"
                >
                  ← Change details
                </button>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                Didn&apos;t receive it? Check spam or resend. OTP is valid for 10
                minutes.
              </p>
            </div>
          ) : (
          <>
            {/* Patient Information */}
            <div className={cardCls}>
              <h3 className={cardTitleCls}>
                <span className={iconBubble}>
                  <Stethoscope className="h-4 w-4" />
                </span>
                Patient Information
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <label className={labelCls}>
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={form.patientName}
                    onChange={(e) => update('patientName', e.target.value)}
                    onBlur={() => trackFieldBlur('patientName')}
                    className={errors.patientName ? inputErr : inputCls}
                    placeholder="Full name"
                    autoComplete="name"
                    enterKeyHint="next"
                  />
                  {errors.patientName && <p className={errCls}>{errors.patientName}</p>}
                </div>

                <div className="min-w-0">
                  <label className={labelCls}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={form.patientPhone}
                    onChange={(e) => update('patientPhone', e.target.value)}
                    onBlur={() => trackFieldBlur('patientPhone')}
                    className={errors.patientPhone ? inputErr : inputCls}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                    enterKeyHint="next"
                  />
                  {errors.patientPhone && <p className={errCls}>{errors.patientPhone}</p>}
                </div>

                <div className="min-w-0">
                  <label className={labelCls}>
                    Email * (OTP verification)
                  </label>
                  <input
                    type="email"
                    inputMode="email"
                    value={form.patientEmail}
                    onChange={(e) => {
                      update('patientEmail', e.target.value);
                      // Editing the email invalidates a previously verified
                      // bookingToken (the token is bound to the old address).
                      if (bookingToken) resetToken();
                    }}
                    onBlur={() => trackFieldBlur('patientEmail')}
                    className={errors.patientEmail ? inputErr : inputCls}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    enterKeyHint="next"
                  />
                  {errors.patientEmail && <p className={errCls}>{errors.patientEmail}</p>}
                  {bookingToken && (
                    <p className="mt-1 text-xs font-medium text-green-600">
                      ✓ Email verified
                    </p>
                  )}
                </div>

                <div className="grid min-w-0 grid-cols-2 gap-3 sm:contents">
                  <div className="min-w-0">
                    <label className={labelCls}>
                      Age *
                    </label>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={form.patientAge}
                      onChange={(e) => update('patientAge', e.target.value)}
                      className={errors.patientAge ? inputErr : inputCls}
                      placeholder="Age"
                      min={1}
                    />
                    {errors.patientAge && <p className={errCls}>{errors.patientAge}</p>}
                  </div>

                  <div className="min-w-0">
                    <label className={labelCls}>
                      Gender
                    </label>
                    <select
                      value={form.patientGender}
                      onChange={(e) => update('patientGender', e.target.value)}
                      className={selectCls}
                    >
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <label className={labelCls}>
                    Address *
                  </label>
                  <textarea
                    value={form.patientAddress}
                    onChange={(e) => update('patientAddress', e.target.value)}
                    className={errors.patientAddress ? areaErr : areaCls}
                    placeholder="Full address"
                    autoComplete="street-address"
                    rows={2}
                  />
                  {errors.patientAddress && <p className={errCls}>{errors.patientAddress}</p>}
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className={cardCls}>
              <h3 className={cardTitleCls}>
                <span className={iconBubble}>
                  <Calendar className="h-4 w-4" />
                </span>
                Booking Information
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0 sm:col-span-2">
                  <label className={labelCls}>
                    Service Needed *
                  </label>
                  <select
                    value={form.serviceNeeded}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className={`${selectCls} text-ellipsis`}
                    disabled={serviceTypesLoading}
                  >
                    <option value="">
                      {serviceTypesLoading ? 'Loading services...' : 'Select a service'}
                    </option>
                    {serviceTypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                        {Number(s.serviceCharge) > 0
                          ? ` — ${formatBDT(s.serviceCharge)} (min ${formatBDT(s.minRequiredPayment)})`
                          : ''}
                      </option>
                    ))}
                  </select>
                  {errors.serviceNeeded && <p className={errCls}>{errors.serviceNeeded}</p>}
                </div>

                {/* Payment summary + dummy gateway trigger */}
              {/* Half payment */}
{selectedServiceType && bookingCharge > 0 && (
  <div className="min-w-0 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:col-span-2">
    <p className="text-[13px] font-bold text-amber-900">
      অর্ধেক পেমেন্ট করুন
    </p>
    <p className="mt-1 text-xs text-gray-600">
      মোট {formatBDT(bookingCharge)} — এখন দিন {formatBDT(bookingMinPayment)}, বাকি {formatBDT(bookingCharge - bookingMinPayment)} পরে।
    </p>

    {paymentVerified ? (
      <p className="mt-2 text-xs font-semibold text-green-700">
        ✓ {formatBDT(paidAmount)} পেমেন্ট সম্পন্ন হয়েছে
      </p>
    ) : (
      <button
        type="button"
        onClick={() => {
  setPaymentVerified(true);
  setPaidAmount(bookingMinPayment);
  setPaymentMethod('bkash');
  setTransactionId('bkash-test-' + Date.now());
}}
        className="mt-2.5 h-10 w-full rounded-md bg-emerald-600 px-4 text-[15px] font-bold text-white transition hover:bg-emerald-700 active:bg-emerald-800 sm:text-sm"
      >
        Pay {formatBDT(bookingMinPayment)}
      </button>
    )}
  </div>
)}
                {isMedicineService && (
                  <div className="min-w-0 rounded-lg border border-blue-200 bg-blue-50 p-3 sm:col-span-2">
                    <h4 className="mb-2 text-[13px] font-bold text-blue-800">Medicine Details</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="min-w-0 md:col-span-2">
                        <label className={labelCls}>
                          Medicine Name *
                        </label>
                        <input
                          type="text"
                          value={medicineName}
                          onChange={(e) => setMedicineName(e.target.value)}
                          className={errors.medicineName ? inputErr : inputCls}
                          list="medicine-names"
                        />
                        <datalist id="medicine-names">
                          {medicines.map((m) => (
                            <option key={m.id} value={m.name} />
                          ))}
                        </datalist>
                        {errors.medicineName && <p className={errCls}>{errors.medicineName}</p>}
                      </div>
                      <div className="min-w-0">
                        <label className={labelCls}>
                          Strength / Dosage
                        </label>
                        <input
                          type="text"
                          value={medicineStrength}
                          onChange={(e) => setMedicineStrength(e.target.value)}
                          placeholder="e.g. 500 mg"
                          className={inputCls}
                        />
                      </div>
                      <div className="grid min-w-0 grid-cols-2 gap-3 md:contents">
                        <div className="min-w-0">
                          <label className={labelCls}>
                            Form
                          </label>
                          <select
                            value={medicineForm}
                            onChange={(e) => setMedicineForm(e.target.value)}
                            className={selectCls}
                          >
                            <option value="Tablet">Tablet</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Injection">Injection</option>
                            <option value="Cream">Cream</option>
                            <option value="Drops">Drops</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="min-w-0">
                          <label className={labelCls}>
                            Quantity *
                          </label>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={medicineQuantity}
                            onChange={(e) => setMedicineQuantity(Number(e.target.value) || 1)}
                            className={errors.quantity ? inputErr : inputCls}
                            min="1"
                          />
                          {errors.quantity && <p className={errCls}>{errors.quantity}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {isPrescriptionService && (
                  <div className="min-w-0 rounded-lg border border-green-200 bg-green-50 p-3 sm:col-span-2">
                    <h4 className="mb-2 text-[13px] font-bold text-green-800">Prescription Upload</h4>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="min-w-0 md:col-span-2">
                        <label className={labelCls}>
                          Upload Prescription * (JPG, PNG, PDF)
                        </label>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.pdf"
                          onChange={handlePrescriptionChange}
                          className="block w-full min-w-0 text-[13px] text-gray-500 file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border-0 file:bg-green-600 file:px-3 file:text-[13px] file:font-semibold file:text-white hover:file:bg-green-700"
                        />
                        {prescriptionPreview && (
                          <div className="mt-2">
                            {prescription?.type?.startsWith('image/') ? (
                              <img
                                src={prescriptionPreview}
                                alt="Preview"
                                className="h-auto max-h-36 w-auto max-w-full rounded-md border border-gray-200 object-contain"
                              />
                            ) : (
                              <p className="break-all text-[13px] text-gray-500">{prescription?.name}</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <label className={labelCls}>
                          Doctor Name
                        </label>
                        <input
                          type="text"
                          value={prescriptionDoctorName}
                          onChange={(e) => setPrescriptionDoctorName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="min-w-0">
                        <label className={labelCls}>
                          Doctor Registration Number
                        </label>
                        <input
                          type="text"
                          value={doctorRegNo}
                          onChange={(e) => setDoctorRegNo(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="min-w-0">
                        <label className={labelCls}>
                          Prescription Date
                        </label>
                        <input
                          type="date"
                          value={prescriptionDate}
                          onChange={(e) => setPrescriptionDate(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div className="min-w-0">
                        <label className={labelCls}>
                          Hospital / Clinic Name
                        </label>
                        <input
                          type="text"
                          value={hospitalName}
                          onChange={(e) => setHospitalName(e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid min-w-0 grid-cols-2 gap-3 sm:contents">
                  <div className="min-w-0">
                    <label className={labelCls}>
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={form.preferredDate}
                      onChange={(e) => update('preferredDate', e.target.value)}
                      className={inputCls}
                    />
                  </div>

                  <div className="min-w-0">
                    <label className={labelCls}>
                      Preferred Time
                    </label>
                    <input
                      type="time"
                      value={form.preferredTime}
                      onChange={(e) => update('preferredTime', e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <label className={`${labelCls} flex items-center gap-1.5`}>
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                    <span className="min-w-0">Hospital / Clinic / Diagnostic Center</span>
                  </label>
                  <select
                    value={form.hospital}
                    onChange={(e) => update('hospital', e.target.value)}
                    className={`${selectCls} text-ellipsis`}
                    disabled={hospitalsLoading}
                  >
                    <option value="">
                      {hospitalsLoading ? 'Loading hospitals...' : 'Select a hospital (optional)'}
                    </option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name} {h.type !== 'Hospital' ? `(${h.type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {isDoctorAppointment && (
                  <div className="min-w-0 sm:col-span-2">
                    <label className={`${labelCls} flex items-start gap-1.5 leading-snug`}>
                      <Stethoscope className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
                      <span className="min-w-0">ডাক্তার (ঐচ্ছিক) — তালিকা থেকে নির্বাচন বা নিজে লিখে দিন</span>
                    </label>
                    <input
                      type="text"
                      list="booking-doctors"
                      value={form.doctorName || ''}
                      onChange={(e) => handleDoctorChange(e.target.value)}
                      onBlur={() => trackFieldBlur('doctorName')}
                      className={inputCls}
                      placeholder={doctorsLoading ? 'ডাক্তার লোড হচ্ছে...' : 'ডাক্তার নাম নির্বাচন বা লিখুন'}
                      autoComplete="off"
                    />
                    {/* Datalist-backed combobox: pick a doctor from the list, or
                        keep typing a free-text override. Selecting a listed name
                        resolves doctorId; any other text clears it so the wording
                        the visitor wrote is preserved. */}
                    <datalist id="booking-doctors">
                      {doctors.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.title
                            ? `${d.name} (${d.title})`
                            : d.name}
                          {d.specialization ? ` — ${d.specialization}` : ''}
                        </option>
                      ))}
                    </datalist>
                    <p className="mt-1 break-words text-xs leading-relaxed text-gray-500">
                      {form.doctorId
                        ? 'নির্বাচিত: ' + (doctors.find((d) => d.id === form.doctorId)?.name || form.doctorName)
                        : 'তালিকা থেকে নির্বাচন করুন, অথবা মান পরিবর্তন করে লিখুন।'}
                    </p>
                  </div>
                )}

                <div className="min-w-0 sm:col-span-2">
                  <label className={labelCls}>
                    Booking Reason / Service Details *
                  </label>
                  <textarea
                    value={form.bookingReason}
                    onChange={(e) => update('bookingReason', e.target.value)}
                    className={errors.bookingReason ? areaErr : areaCls}
                    placeholder="Please describe the reason for this booking"
                    rows={3}
                  />
                  {errors.bookingReason && <p className={errCls}>{errors.bookingReason}</p>}
                </div>

                <div className="min-w-0 sm:col-span-2">
                  <label className={labelCls}>
                    Additional Note
                  </label>
                  <textarea
                    value={form.additionalNote}
                    onChange={(e) => update('additionalNote', e.target.value)}
                    className={areaCls}
                    placeholder="Anything else we should know?"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </>
          )}
          </div>

          {/* Footer: one compact row — small gray Cancel + main green action.
              Respects the iPhone home-indicator area. */}
          <div className="flex shrink-0 items-center gap-2 border-t border-gray-200 bg-white px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || verifying}
              className="h-10 shrink-0 rounded-md bg-gray-200 px-5 text-[15px] font-semibold text-gray-700 transition hover:bg-gray-300 active:bg-gray-300 sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || frozen || sendingOtp || verifying || (step !== 'otp' && paymentRequired && !paymentVerified)}
              className="h-10 min-w-0 flex-1 truncate rounded-md bg-green-600 px-4 text-[15px] font-bold text-white transition hover:bg-green-700 active:bg-green-700 disabled:opacity-50 sm:text-sm"
            >
              {frozen
                ? 'Agent Frozen'
                : verifying
                ? 'Verifying…'
                : step === 'otp'
                ? loading
                  ? 'Submitting...'
                  : 'Verify & Complete'
                : sendingOtp
                ? 'Sending OTP…'
                : loading
                ? 'Submitting...'
                : paymentRequired && !paymentVerified
                ? 'Pay & Submit Booking Request'
                : 'Submit Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
