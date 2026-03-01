'use client';

import { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const code = otp.join('');
    if (code.length !== 6) { setError('Enter the full 6-digit code'); return; }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? 'Invalid OTP'); return; }
      router.push('/listings');
    } catch {
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      setSuccess('New code sent!');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to resend.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="card p-8 text-center">
        <div className="text-4xl mb-4">📱</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your phone</h1>
        <p className="text-gray-500 text-sm mb-6">
          Enter the 6-digit code sent to <strong>{phone}</strong>
        </p>

        <div className="flex gap-2 justify-center mb-6">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-brand focus:outline-none transition-colors"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-600 text-sm mb-4">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm mb-4">{success}</p>
        )}

        <button onClick={handleVerify} className="btn-primary w-full mb-4" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify Phone'}
        </button>

        <button
          onClick={handleResend}
          className="text-sm text-gray-500 hover:text-brand disabled:opacity-50"
          disabled={resending}
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
