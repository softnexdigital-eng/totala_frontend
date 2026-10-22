'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { GENDER_OPTIONS } from '@/lib/bookingOptions';
import { validateEmail, validateOTP } from '@/lib/validation';
import { trackLead, getFingerprint } from '@/lib/antiFraud';
import { useBookingOtp } from '@/components/booking/useBookingOtp';

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  hospital?: string;
}

interface Agent {
  id: string;
  name: string;
}

export default function NewBookingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedAgentId = searchParams.get('agentId') || '';

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientPhone: '',
    patientEmail: '',
    patientAge: '',
    patientGender: '',
    patientAddress: '',
    serviceType: 'online',
    doctorId: '',
    preferredDoctor: '',
    hospital: '',
    date: '',
    time: '',
    notes: '',
    agentId: preselectedAgentId,
  });

  /* ---------------------------------------------------------- anti-fraud -- */
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
  const [honeypot, setHoneypot] = useState('');
  const [otpError, setOtpError] = useState('');
  const trackedFields = useRef<Set<string>>(new Set());
  // Single-use token guard (double Enter / StrictMode double-invoke replays
  // the token -> backend 403 "suspicious" with no booking stored).
  const submitInflight = useRef(false);

  /** Fire-and-forget drop-off tracking, once per field (admin Security tab). */
  const trackFieldBlur = (fieldName: string) => {
    if (trackedFields.current.has(fieldName)) return;
    trackedFields.current.add(fieldName);
    trackLead({
      fieldName,
      formStage: 'typing',
      name: formData.patientName || undefined,
      phone: formData.patientPhone || undefined,
      email: formData.patientEmail || undefined,
    });
  };

  useEffect(() => {
    fetchDoctors();
    fetchAgents();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await fetch('/api/doctors');
      const data = await response.json();
      if (data.success) {
        setDoctors(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/public-agents');
      const data = await response.json();
      if (data.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation before anything leaves the browser.
    if (!formData.patientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    if (!formData.patientPhone.trim()) {
      toast.error('Phone number is required');
      return;
    }
    if (!formData.patientEmail.trim()) {
      toast.error('Email is required (for OTP verification)');
      return;
    }
    if (!validateEmail(formData.patientEmail)) {
      toast.error('Enter a valid email address');
      return;
    }
    if (!formData.patientAddress.trim()) {
      toast.error('Address is required');
      return;
    }
    if (!formData.date || !formData.time) {
      toast.error('Preferred date and time are required');
      return;
    }

    // Anti-fraud step 1: no bookingToken yet — email the OTP first.
    if (!bookingToken) {
      trackLead({
        fieldName: 'formSubmit',
        formStage: 'otpRequested',
        name: formData.patientName || undefined,
        phone: formData.patientPhone || undefined,
        email: formData.patientEmail || undefined,
      });
      setLoading(true);
      try {
        await requestOtp(formData.patientEmail.trim());
      } finally {
        setLoading(false);
      }
      return;
    }

    await submitBooking(bookingToken);
  };

  /** Anti-fraud step 2: verify the OTP, then create with the fresh token. */
  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || verifying) return; // double Enter guard: token is single-use
    if (!validateOTP(otp)) {
      setOtpError('Enter the 6-digit OTP from your email');
      return;
    }
    setOtpError('');
    setLoading(true);
    try {
      const token = await verifyOtp(formData.patientEmail.trim());
      if (token) await submitBooking(token);
    } finally {
      setLoading(false);
    }
  };

  /** Final step: create the booking with token + idempotency + bot-trap fields.
   *  Guarded: bookingToken is single-use, a replayed duplicate gets a 403
   *  "suspicious" block from the backend with no booking stored. */
  const submitBooking = async (token: string) => {
    if (submitInflight.current) return;
    submitInflight.current = true;
    setLoading(true);

    try {
      // Public, no-auth endpoint: it resolves (or auto-creates) the patient
      // profile and stores the booking request that the Super Admin reviews
      // under "Agent Booking Requests".
      const response = await fetch('/api/public/booking-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fingerprint': getFingerprint(),
        },
        body: JSON.stringify({
          agentId: formData.agentId || null,
          serviceNeeded:
            formData.serviceType === 'package'
              ? 'Package Booking'
              : 'Doctor Appointment',
          preferredDate: formData.date,
          preferredTime: formData.time,
           hospital: formData.hospital || selectedDoctor?.hospital || '',
           bookingReason:
             formData.notes || 'Booking request submitted from the website',
           additionalNote: selectedDoctor
             ? `Preferred doctor: ${selectedDoctor.name}${
                 selectedDoctor.specialization
                   ? ` (${selectedDoctor.specialization})`
                   : ''
               }`
             : formData.preferredDoctor
               ? `Preferred doctor (not in list): ${formData.preferredDoctor}`
               : '',
          patient: {
            name: formData.patientName,
            phone: formData.patientPhone,
            email: formData.patientEmail.trim().toLowerCase(),
            age: formData.patientAge,
            gender: formData.patientGender || undefined,
            address: formData.patientAddress,
          },
          // Anti-fraud: verified email token, double-submit protection,
          // bot-trap timing and the hidden honeypot field.
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
          name: formData.patientName || undefined,
          phone: formData.patientPhone || undefined,
          email: formData.patientEmail || undefined,
        });
        toast.success('Booking submitted successfully! We will contact you soon.');
        if (result.data?.autoCreatedPatient) {
          toast('A new patient profile was created for you', { icon: '🆕' });
        }
        router.push('/');
      } else {
        toast.error(result.message || 'Booking failed');
        // Token expired / consumed / email mismatch / suspicious (403) —
        // restart the OTP flow so the next try uses a fresh token + key.
        if (response.status === 401 || response.status === 400 || response.status === 403) {
          resetToken();
        }
        if (response.status === 403 || response.status === 429) {
          idempotencyKey.current = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        }
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      submitInflight.current = false;
      setLoading(false);
    }
  };

  // A doctor is chosen either by selecting from the dropdown (doctorId) or by
  // typing a name that matches a known doctor in the combobox. Resolving the
  // typed name keeps the hospital auto-fill working while still letting the
  // user type a *custom* doctor that isn't in our list.
  const selectedDoctor =
    doctors.find((d) => d.id === formData.doctorId) ||
    (formData.preferredDoctor
      ? doctors.find(
          (d) => d.name.toLowerCase() === formData.preferredDoctor.trim().toLowerCase()
        )
      : undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Book an Appointment</h1>
          <p className="mt-2 text-gray-600">
            Fill in the details below and we will get back to you shortly
          </p>
        </div>

        {/* Booking Form */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form
            onSubmit={step === 'otp' ? handleVerifyAndSubmit : handleSubmit}
            className="space-y-6"
          >
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

            {/* ---------- Step 2: email OTP verification ---------- */}
            {step === 'otp' && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                <h2 className="text-lg font-semibold text-green-800 mb-2">
                  Verify your email
                </h2>
                <p className="text-sm text-gray-700">
                  We sent a 6-digit OTP to{' '}
                  <span className="font-semibold">{formData.patientEmail}</span>.
                  Enter it below to confirm your booking request.
                </p>

                <label className="mt-4 block text-sm font-medium text-gray-700 mb-1">
                  Email OTP *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    if (otpError) setOtpError('');
                  }}
                  className={`w-full px-4 py-2 text-center text-lg tracking-[0.5em] border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${
                    otpError ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder="••••••"
                  autoFocus
                />
                {otpError && (
                  <p className="mt-1 text-xs text-red-600">{otpError}</p>
                )}

                <div className="mt-4 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => requestOtp(formData.patientEmail.trim())}
                    disabled={sendingOtp}
                    className="text-sm font-medium text-green-700 hover:underline disabled:opacity-50"
                  >
                    {sendingOtp ? 'Sending…' : 'Resend OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('form')}
                    className="text-sm font-medium text-gray-500 hover:underline"
                  >
                    ← Change details
                  </button>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Didn&apos;t receive it? Check spam or resend. OTP is valid for 10
                  minutes.
                </p>
              </div>
            )}

            {/* ---------- Step 1: booking form ---------- */}
            {step === 'form' && (
              <>
            {/* Patient Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Patient Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.patientName}
                    onChange={(e) =>
                      setFormData({ ...formData, patientName: e.target.value })
                    }
                    onBlur={() => trackFieldBlur('patientName')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter patient name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.patientPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, patientPhone: e.target.value })
                    }
                    onBlur={() => trackFieldBlur('patientPhone')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email * (OTP verification)
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.patientEmail}
                    onChange={(e) => {
                      setFormData({ ...formData, patientEmail: e.target.value });
                      // Editing the email invalidates a previously verified
                      // bookingToken (the token is bound to the old address).
                      if (bookingToken) resetToken();
                    }}
                    onBlur={() => trackFieldBlur('patientEmail')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                  {bookingToken && (
                    <p className="mt-1 text-xs text-green-600">✓ Email verified</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.patientAge}
                      onChange={(e) =>
                        setFormData({ ...formData, patientAge: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter age"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={formData.patientGender}
                      onChange={(e) =>
                        setFormData({ ...formData, patientGender: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {GENDER_OPTIONS.map((option) => (
                        <option key={option.label} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    required
                    value={formData.patientAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, patientAddress: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter address"
                  />
                </div>
              </div>
            </div>

            {/* Appointment Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Appointment Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    required
                    value={formData.serviceType}
                    onChange={(e) =>
                      setFormData({ ...formData, serviceType: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="online">Online</option>
                    <option value="package">Package</option>
                  </select>
                </div>

                {doctors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor *
                    </label>
                    {/*
                      Editable combobox: pick a doctor from the list OR type your
                      preferred doctor. We track BOTH the matched doctorId (for the
                      backend) and the typed preferredDoctor text (so a custom doctor
                      name that isn't in our list is still forwarded).
                    */}
                    <input
                      type="search"
                      list="doctor-list"
                      value={formData.preferredDoctor || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        const match = doctors.find(
                          (d) => d.name.toLowerCase() === value.trim().toLowerCase()
                        );
                        setFormData({
                          ...formData,
                          preferredDoctor: value,
                          doctorId: match ? match.id : '',
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Select or type a doctor"
                      required
                    />
                    <datalist id="doctor-list">
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.name}>
                          {doctor.specialization}
                        </option>
                      ))}
                    </datalist>
                  </div>
                )}

                {(selectedDoctor?.hospital || formData.hospital) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hospital/Clinic
                    </label>
                    <input
                      type="text"
                      value={formData.hospital || selectedDoctor?.hospital || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, hospital: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Hospital/Clinic (editable)"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agent
                  </label>
                  <select
                    value={formData.agentId}
                    onChange={(e) =>
                      setFormData({ ...formData, agentId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select an agent (optional)</option>
                    {agents.map((agent) => (
                      <option key={agent.id} value={agent.id}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Any additional information"
                  />
                </div>
              </div>
            </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || sendingOtp || verifying}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying
                ? 'Verifying…'
                : step === 'otp'
                ? loading
                  ? 'Submitting...'
                  : 'Verify OTP & Submit'
                : sendingOtp
                ? 'Sending OTP…'
                : loading
                ? 'Submitting...'
                : 'Submit Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
