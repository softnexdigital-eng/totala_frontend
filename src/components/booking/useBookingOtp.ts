'use client';

import { useCallback, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { newIdempotencyKey, getFingerprint } from '@/lib/antiFraud';

/**
 * Shared email-OTP state machine for the public booking forms
 * (BookNowModal and /bookings/new).
 *
 * Flow (matches the backend anti-fraud API):
 *   1. requestOtp(email)  -> POST /api/public/booking-otp/request
 *   2. verifyOtp(email)   -> POST /api/public/booking-otp/verify -> bookingToken
 *   3. booking create     -> must include the bookingToken + idempotencyKey
 *
 * A bookingToken is single-use (15 min TTL) and bound to the email it was
 * issued for — callers must clear it when the email changes.
 */
export type OtpStep = 'form' | 'otp';

export function useBookingOtp() {
  const [step, setStep] = useState<OtpStep>('form');
  const [otp, setOtp] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [bookingToken, setBookingToken] = useState<string | null>(null);

  /** When the form first rendered — sent as `formOpenedAt` so the backend
   *  bot-trap can reject submits faster than a human could type. */
  const formOpenedAt = useRef<number>(Date.now());
  /** Single-use idempotency key so double-click/retry creates one booking. */
  const idempotencyKey = useRef<string>(newIdempotencyKey());
  /** In-flight guards: React 18 StrictMode / double Enter can fire the same
   *  handler twice — without this the single-use bookingToken is consumed by
   *  the first request and the duplicate gets flagged as suspicious (403). */
  const sendingRef = useRef(false);
  const verifyingRef = useRef(false);

  /** Step 1: email the OTP. Returns true when the OTP screen should show. */
  const requestOtp = useCallback(async (email: string): Promise<boolean> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return false;
    if (sendingRef.current) return false;
    sendingRef.current = true;
    setSendingOtp(true);
    try {
      const res = await fetch('/api/public/booking-otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-fingerprint': getFingerprint() },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json().catch(() => null);
      if (data?.success) {
        toast.success(data.message || 'OTP sent to your email');
        setOtp('');
        setStep('otp');
        return true;
      }
      toast.error(data?.message || 'Could not send OTP — please try again');
      return false;
    } catch {
      toast.error('Could not reach the booking service — please try again');
      return false;
    } finally {
      sendingRef.current = false;
      setSendingOtp(false);
    }
  }, []);

  /**
   * Step 2: verify the OTP. Returns the bookingToken on success, else null.
   * The caller should immediately create the booking with that token.
   * NOTE: no success toast here on purpose — the booking is NOT confirmed yet,
   * only the email is. The success toast is shown after the booking is stored,
   * otherwise visitors see "confirmed" and then a block error (confusing).
   */
  const verifyOtp = useCallback(async (email: string): Promise<string | null> => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !otp || verifyingRef.current) return null;
    verifyingRef.current = true;
    setVerifying(true);
    try {
      const res = await fetch('/api/public/booking-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-fingerprint': getFingerprint() },
        body: JSON.stringify({ email: normalized, otp }),
      });
      const data = await res.json().catch(() => null);
      if (data?.success && data?.data?.bookingToken) {
        setBookingToken(data.data.bookingToken);
        return data.data.bookingToken as string;
      }
      toast.error(data?.message || 'OTP verification failed');
      return null;
    } catch {
      toast.error('Could not reach the booking service — please try again');
      return null;
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  }, [otp]);

  /** Invalidate the token (email edited / token consumed) and return to form. */
  const resetToken = useCallback(() => {
    setBookingToken(null);
    setStep('form');
    setOtp('');
    // Rotate the idempotency key so a retry never replays a consumed
    // single-use bookingToken with a stale key (backend flags that as suspicious).
    idempotencyKey.current = newIdempotencyKey();
  }, []);

  return {
    step,
    setStep,
    otp,
    setOtp,
    sendingOtp,
    verifying,
    bookingToken,
    setBookingToken,
    requestOtp,
    verifyOtp,
    resetToken,
    formOpenedAt,
    idempotencyKey,
  };
}
