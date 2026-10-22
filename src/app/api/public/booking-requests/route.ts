/**
 * Public (no-auth) endpoint used by the landing page "Book Now" modal.
 *
 * Flow:
 *  1. Validate the patient + service details submitted by the visitor.
 *  2. Forward the request to the backend `POST /api/bookings` endpoint, which
 *     reuses an existing Patient profile (matched by phone) or creates a new
 *     one, then links the booking request to that patient (+ agent).
 *
 * Patient + booking data is persisted on the real backend (BACKEND_URL),
 * following the same no-auth pattern used by the existing `/api/public-agents`
 * route. The request reaches the Super Admin via the bookings list.
 */
import { NextResponse } from 'next/server';
import { validatePhone } from '@/lib/validation';
import { backendJson, forwardClientHeaders } from '@/lib/serverProxy';

const BACKEND = process.env.BACKEND_URL;

export async function POST(req: Request) {
  try {
    if (!BACKEND) {
      return NextResponse.json(
        { success: false, message: 'Backend URL is not configured' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      agentId,
      serviceNeeded,
      preferredDate,
      preferredTime,
      hospital,
      doctorId,
      doctorName,
      bookingReason,
      additionalNote,
      patient,
      // Anti-fraud fields — forwarded straight through to the backend:
      bookingToken, // single-use token from POST /api/public/booking-otp/verify
      idempotencyKey, // collapses double-click/retry submits into one booking
      formOpenedAt, // client render timestamp — bot-trap rejects <3s submits
      fingerprint, // stable per-browser id for visitor logs
      company_name, // honeypot field — must stay empty for humans
    } = body || {};

    if (!patient || !patient.name || !patient.phone || !patient.age || !patient.address) {
      return NextResponse.json(
        {
          success: false,
          message: 'Patient name, phone, age and address are required',
        },
        { status: 400 }
      );
    }

    if (!serviceNeeded) {
      return NextResponse.json(
        { success: false, message: 'Service needed is required' },
        { status: 400 }
      );
    }

    const phone = String(patient.phone || '').replace(/\s/g, '');
    const age = Number(patient.age);

    if (!validatePhone(phone)) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid phone number' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(age) || age <= 0 || age > 130) {
      return NextResponse.json(
        { success: false, message: 'Please provide a valid age' },
        { status: 400 }
      );
    }

    // The patient profile is resolved (or auto-created) by the backend while it
    // stores the booking: `/api/patients` needs an admin session, which a public
    // visitor does not have, so that lookup belongs on the backend.
    //
    // Create the booking request and link it to the resolved patient.
    const bookingPayload = {
      patientId: patient.patientId || null,
      agentId: agentId || null,
      // Keep `serviceType` for backend compatibility; add a dedicated field too.
      serviceType: serviceNeeded,
      serviceNeeded,
      patientName: patient.name,
      patientPhone: phone,
      patientAddress: patient.address,
      age,
      gender: patient.gender || undefined,
      date: preferredDate,
      time: preferredTime,
      preferredDate: preferredDate || undefined,
      preferredTime: preferredTime || undefined,
      hospital: hospital || undefined,
      doctorId: doctorId || null,
      doctorName: doctorName || null,
      // Send the individual fields as well so the dashboard keeps the exact
      // reason / note the visitor typed (the combined `notes` string is kept
      // for backwards compatibility with the appointment-style payload).
      bookingReason: bookingReason || undefined,
      additionalNote: additionalNote || undefined,
      notes: [
        `Service Needed: ${serviceNeeded}`,
        bookingReason ? `Reason / Details: ${bookingReason}` : null,
        additionalNote ? `Additional Note: ${additionalNote}` : null,
        agentId ? `Agent: ${agentId}` : null,
      ]
        .filter(Boolean)
        .join('\n'),
      status: 'PENDING',
      // Mandatory initial-payment snapshot (dummy gateway verified on the
      // client; backend re-validates the amount against the service charge).
      serviceTypeId: body.serviceTypeId || undefined,
      totalServiceCharge: body.totalServiceCharge ?? undefined,
      minRequiredPayment: body.minRequiredPayment ?? undefined,
      amountPaid: body.amountPaid ?? undefined,
      paymentMethod: body.paymentMethod || undefined,
      transactionId: body.transactionId || undefined,
      paymentVerified: body.paymentVerified ?? undefined,
      // Anti-fraud passthrough (backend requires a valid bookingToken and
      // enforces the honeypot / formOpenedAt bot-trap on create).
      patientEmail: patient.email ? String(patient.email).trim().toLowerCase() : undefined,
      bookingToken: bookingToken || undefined,
      idempotencyKey: idempotencyKey || undefined,
      formOpenedAt: formOpenedAt || undefined,
      fingerprint: fingerprint || undefined,
      company_name: company_name || undefined,
    };

    const booking = await backendJson(`${BACKEND}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...forwardClientHeaders(req),
      },
      body: JSON.stringify(bookingPayload),
    });

    if (!booking.ok) {
      return NextResponse.json(
        {
          success: false,
          // Prefer the backend's own message so validation problems stay visible
          // instead of always showing a generic "please try again".
          message:
            booking.data?.message ||
            booking.data?.error ||
            (booking.status === 0
              ? 'Could not reach the booking service. Please try again.'
              : 'Failed to submit booking request. Please try again.'),
        },
        { status: booking.status || 502 }
      );
    }

    // The backend returns the stored booking, echoing the linked patient and
    // `autoCreatedPatient` so the UI can confirm what happened.
    const result = booking.data?.data || booking.data || {};

    return NextResponse.json({
      success: true,
      message: 'Booking request submitted successfully!',
      data: result,
    });
  } catch (error: any) {
    console.error('[public/booking-requests] error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
