'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

/* ─── Left panel stats ─────────────────────────────────────────────────────── */


/* ─── Shared input field ───────────────────────────────────────────────────── */

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {label}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputCls =
  'block w-full px-4 py-3 text-sm rounded-xl border border-slate-200 bg-white ' +
  'text-slate-900 placeholder:text-slate-400 ' +
  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ' +
  'transition-all duration-150';

/* ─── Eye toggle ───────────────────────────────────────────────────────────── */

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      tabIndex={-1}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
    >
      <svg className="w-4.5 h-4.5 w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {show ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        ) : (
          <>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </>
        )}
      </svg>
    </button>
  );
}

/* ─── Login form ───────────────────────────────────────────────────────────── */

type Step = 'phone' | 'password';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/listings';

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function goToPassword(e: React.FormEvent) {
    e.preventDefault();
    if (phone.trim()) { setError(''); setStep('password'); }
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(typeof data.error === 'string' ? data.error : 'Login failed. Please try again.');
        return;
      }
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      router.push(redirect);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">

      {/* ══ LEFT: Brand panel ══════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[46%] xl:w-[44%] bg-slate-900 flex-col relative overflow-hidden">

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900 pointer-events-none" />

        {/* Dot-grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative flex flex-col h-full px-10 xl:px-14 py-10">

          {/* Logo — pinned to top */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="flex gap-0.5">
              <div className="w-4 h-4 bg-emerald-400 rounded-sm" />
              <div className="w-4 h-4 bg-amber-400 rounded-sm opacity-80" />
            </div>
            <span className="font-bold text-white text-base tracking-tight">
              SureLeads <span className="font-normal text-slate-400">Listings</span>
            </span>
          </Link>

          {/* Headline — centered in remaining space */}
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">
              Lagos Property Platform
            </p>
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
              Your search for the
              <br />
              <span className="text-emerald-400">perfect Lagos home</span>
              <br />
              starts here.
            </h2>
          </div>

          {/* Bottom legal */}
          <div className="flex-shrink-0">
            <p className="text-xs text-slate-600 leading-relaxed text-center">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-slate-400 hover:text-white underline transition-colors">
                Terms
              </Link>{' '}&{' '}
              <Link href="/privacy" className="text-slate-400 hover:text-white underline transition-colors">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </div>

      {/* ══ RIGHT: Form panel ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-12 lg:px-14 xl:px-20 bg-slate-50">

        {/* Mobile logo */}
        <div className="mb-10 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-4 h-4 bg-emerald-500 rounded-sm" />
              <div className="w-4 h-4 bg-amber-400 rounded-sm opacity-80" />
            </div>
            <span className="font-bold text-slate-900 text-base">
              SureLeads <span className="font-normal text-slate-400">Listings</span>
            </span>
          </Link>
        </div>

        <div className="w-full max-w-[22rem] mx-auto">

          {/* Back arrow (password step) */}
          {step === 'password' && (
            <button
              type="button"
              onClick={() => { setStep('phone'); setError(''); }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          )}

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900">
              {step === 'phone' ? 'Welcome back' : 'Enter your password'}
            </h1>
            <p className="text-sm text-slate-500 mt-1.5">
              {step === 'phone'
                ? 'Sign in to your SureLeads account'
                : <span className="font-medium text-slate-700">{phone}</span>}
            </p>
          </div>

          {/* ── Step 1: Phone ── */}
          {step === 'phone' && (
            <form onSubmit={goToPassword} className="space-y-5">
              <Field label="Phone number">
                <input
                  type="tel" autoFocus required
                  placeholder="+234 800 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputCls}
                />
              </Field>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-sm shadow-emerald-900/20"
              >
                Continue →
              </button>

              <a
                href="/api/auth/google?role=CLIENT"
                className="flex items-center justify-center gap-2.5 w-full border border-slate-200 bg-white rounded-xl py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </a>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 border-t border-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or use phone</span>
                <div className="flex-1 border-t border-slate-200" />
              </div>

              {/* Register CTA */}
              <Link
                href="/register"
                className="flex items-center justify-center gap-2 w-full border border-slate-200 bg-white rounded-xl py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                New to SureLeads? Create account
              </Link>
            </form>
          )}

          {/* ── Step 2: Password ── */}
          {step === 'password' && (
            <form onSubmit={handleSignIn} className="space-y-5">
              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    autoFocus required
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputCls} pr-11`}
                  />
                  <EyeToggle show={showPwd} onToggle={() => setShowPwd(!showPwd)} />
                </div>
              </Field>

              {/* Forgot password */}
              <div className="text-right -mt-2">
                <Link href="/forgot-password" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-sm shadow-emerald-900/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in…
                  </>
                ) : 'Sign in'}
              </button>
            </form>
          )}

          {/* Agent CTA banner */}
          <div className="mt-8 p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Real estate agent?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <Link href="/login" className="text-emerald-600 font-medium hover:underline">Log in</Link>
                {' '}or{' '}
                <Link href="/register/agent" className="text-emerald-600 font-medium hover:underline">create an agent account</Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
