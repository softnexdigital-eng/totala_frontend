'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { CreditCard, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { formatBDT } from '@/lib/payments';

/**
 * bKash-only payment checkout.
 * NEVER collects PINs, OTPs, or passwords.
 */

export type DummyCheckoutResult = {
  success: boolean;
  method: string;
  amount: number;
  txnId: string;
};

interface DummyCheckoutProps {
  amount: number;
  onVerified: (result: DummyCheckoutResult) => void;
  onCancel?: () => void;
}

const METHOD = 'bKash';

export default function DummyCheckout({ amount, onVerified, onCancel }: DummyCheckoutProps) {
  const [stage, setStage] = useState<'select' | 'processing' | 'result'>('select');
  const [result, setResult] = useState<{ status: 'SUCCESS' | 'FAILED'; txnId: string } | null>(null);
  const payable = Number(amount) || 0;

  const handlePay = async (forceResult: 'SUCCESS' | 'FAILED') => {
    if (payable <= 0) {
      toast.error('Payable amount must be greater than 0');
      return;
    }
    setStage('processing');
    setResult(null);
    try {
      const checkoutRes = await fetch('/api/payment-gateway/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ method: METHOD, amount: payable }),
      });
      const checkoutJson = await checkoutRes.json();
      const session = checkoutJson?.data || checkoutJson;
      if (!checkoutJson?.success || !session) {
        toast.error(checkoutJson?.message || 'Could not start payment');
        setStage('select');
        return;
      }
      const verifyRes = await fetch('/api/payment-gateway/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ method: METHOD, amount: payable, txnId: session.txnId, forceResult }),
      });
      const verifyJson = await verifyRes.json();
      const outcome = verifyJson?.data || verifyJson;
      setResult({ status: outcome.status, txnId: outcome.txnId });
      setStage('result');
      if (outcome.status === 'SUCCESS') {
        onVerified({ success: true, method: METHOD, amount: payable, txnId: outcome.txnId });
      }
    } catch {
      toast.error('Payment gateway unavailable');
      setStage('select');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="bg-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            <h3 className="font-semibold">bKash Secure Checkout</h3>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs text-slate-500">Amount to pay</p>
            <p className="text-2xl font-bold text-slate-900">{formatBDT(payable)}</p>
          </div>
          {stage === 'select' && (
            <>
              <button
                type="button"
                onClick={() => handlePay('SUCCESS')}
                className="w-full rounded-lg bg-gradient-to-r from-pink-500 to-rose-600 px-4 py-3 text-sm font-semibold text-white hover:from-pink-600 hover:to-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                Pay with bKash
              </button>
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
            </>
          )}
          {stage === 'processing' && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
              <p className="mt-3 text-sm">Processing bKash payment…</p>
            </div>
          )}
          {stage === 'result' && result && (
            <div className="space-y-3">
              <div
                className={`flex items-center gap-2 rounded-lg p-3 ${
                  result.status === 'SUCCESS' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}
              >
                {result.status === 'SUCCESS' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <span className="text-sm font-semibold">
                  {result.status === 'SUCCESS' ? 'Payment successful' : 'Payment failed'}
                </span>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <p><span className="font-medium">Transaction ID:</span> {result.txnId}</p>
                <p><span className="font-medium">Method:</span> bKash</p>
                <p><span className="font-medium">Amount:</span> {formatBDT(payable)}</p>
              </div>
              {result.status !== 'SUCCESS' && (
                <button
                  type="button"
                  onClick={() => setStage('select')}
                  className="w-full rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
