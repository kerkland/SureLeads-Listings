'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ─── Shared field component ───────────────────────────── */

function FloatField({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-sl-slate-200 rounded-lg focus-within:border-2
                     focus-within:border-sl-green-500 transition-all overflow-hidden">
      <div className="flex items-center justify-between pt-2.5 px-4">
        <span className="text-[11px] font-semibold text-sl-slate-400 leading-none">
          {label}{required && '*'}
        </span>
        {hint && <span className="text-[11px] text-sl-slate-300">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  'block w-full px-4 pb-3 pt-1 text-sm bg-transparent text-sl-slate-900 ' +
  'focus:outline-none placeholder:text-sl-slate-300';

/* ─── Register page ────────────────────────────────────── */

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName:        '',
    phone:           '',
    email:           '',
    password:        '',
    confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role: 'CLIENT' }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(typeof data.error === 'string' ? data.error : 'Registration failed.');
        return;
      }
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone }),
      });
      router.push(
        `/verify?phone=${encodeURIComponent(form.phone)}&next=${encodeURIComponent('/listings')}`,
      );
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-[26rem]">

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl border border-sl-slate-200
                         shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12)] overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-sl-slate-100">
            <Link
              href="/login"
              className="w-8 h-8 flex items-center justify-center rounded-full
                         hover:bg-sl-slate-100 text-sl-slate-500 transition-colors"
              aria-label="Back to login"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <Link
              href="/"
              className="w-8 h-8 flex items-center justify-center rounded-full
                         hover:bg-sl-slate-100 text-sl-slate-400 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>

          {/* Body */}
          <div className="px-6 pt-6 pb-7">
            <h1 className="text-xl font-bold text-sl-slate-900 mb-1">
              Create your account
            </h1>
            <p className="text-sm text-sl-slate-400 mb-5">
              Lagos&apos;s trusted property search platform
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">

              <FloatField label="Full name" required>
                <input
                  type="text" required autoFocus
                  placeholder="Chukwuemeka Obi"
                  value={form.fullName} onChange={set('fullName')}
                  className={inputCls}
                />
              </FloatField>

              <FloatField label="Phone number" required>
                <input
                  type="tel" required
                  placeholder="+234 800 000 0000"
                  value={form.phone} onChange={set('phone')}
                  className={inputCls}
                />
              </FloatField>

              <FloatField label="Email address" hint="optional">
                <input
                  type="email"
                  placeholder="you@email.com"
                  value={form.email} onChange={set('email')}
                  className={inputCls}
                />
              </FloatField>

              <FloatField label="Password" required>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    required minLength={8}
                    placeholder="At least 8 characters"
                    value={form.password} onChange={set('password')}
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-0 bottom-0 flex items-center
                               text-sl-slate-400 hover:text-sl-slate-700 transition-colors"
                    tabIndex={-1}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showPwd ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97
                             9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242
                             4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0
                             0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025
                             0 01-4.132 5.411m0 0L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542
                               7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </FloatField>

              <FloatField label="Confirm password" required>
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="Repeat password"
                  value={form.confirmPassword} onChange={set('confirmPassword')}
                  className={inputCls}
                />
              </FloatField>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                                 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sl-slate-900 hover:bg-sl-slate-700 disabled:opacity-60
                           text-white font-semibold py-3.5 rounded-xl transition-colors text-sm"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 border-t border-sl-slate-200" />
              <span className="text-xs text-sl-slate-400">or</span>
              <div className="flex-1 border-t border-sl-slate-200" />
            </div>

            <Link
              href="/login"
              className="flex items-center justify-center w-full border border-sl-slate-200
                         rounded-xl py-3.5 text-sm font-medium text-sl-slate-700
                         hover:bg-sl-slate-50 transition-colors"
            >
              Already have an account? Log in
            </Link>
          </div>

          {/* ── Agent footer ── */}
          <div className="px-6 py-4 border-t border-sl-slate-100 bg-sl-slate-50 text-center">
            <p className="text-sm font-semibold text-sl-slate-800 mb-0.5">
              Are you a real estate agent?
            </p>
            <p className="text-sm text-sl-slate-500">
              <Link href="/login"
                    className="underline underline-offset-2 hover:text-sl-slate-900 transition-colors">
                Log in
              </Link>
              {' '}or{' '}
              <Link href="/register/agent"
                    className="underline underline-offset-2 hover:text-sl-slate-900 transition-colors">
                create an account
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
