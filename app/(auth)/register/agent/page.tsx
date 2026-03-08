'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ─── Agent benefits ───────────────────────────────────────────────────────── */

const BENEFITS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Free verified agent profile',
    desc: 'Show up when Lagos renters search for a trusted agent in your area.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
    title: 'Generate &amp; manage leads',
    desc: 'Connect with renters who book property inspections through SureLeads.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Build your credibility score',
    desc: 'Earn a badge — top-rated agents attract more enquiries.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    title: 'List &amp; manage properties',
    desc: 'Post verified listings with video walkthroughs and track performance.',
  },
];

/* ─── Field component ──────────────────────────────────────────────────────── */

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
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

/* ─── Page ─────────────────────────────────────────────────────────────────── */

export default function AgentRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', password: '', confirmPassword: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        body: JSON.stringify({ ...form, role: 'AGENT' }),
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
        `/verify?phone=${encodeURIComponent(form.phone)}&next=${encodeURIComponent('/onboarding/agent')}`,
      );
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

        {/* Gradient + pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 via-slate-900 to-slate-900 pointer-events-none" />
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

          {/* Content — centered vertically */}
          <div className="flex-1 flex flex-col justify-center">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-4">
              Agent Console
            </p>
            <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight mb-10">
              Your SureLeads Listings agent
              <br />
              account gives you
              <br />
              <span className="text-emerald-400">a competitive edge:</span>
            </h2>

            {/* Benefits */}
            <div className="space-y-5">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-4">
                  <div className="w-9 h-9 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 flex-shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <p
                      className="text-sm font-semibold text-white"
                      dangerouslySetInnerHTML={{ __html: b.title }}
                    />
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Social proof counter */}
            <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">4,800+ active agents</p>
                <p className="text-xs text-slate-400">are already growing their business on SureLeads</p>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="flex-shrink-0">
            <p className="text-xs text-slate-600 leading-relaxed">
              By creating an account you agree to our{' '}
              <Link href="/terms" className="text-slate-400 hover:text-white underline transition-colors">Terms</Link>
              {' '}&amp;{' '}
              <Link href="/privacy" className="text-slate-400 hover:text-white underline transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>

      {/* ══ RIGHT: Form panel ══════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 py-12 lg:px-14 xl:px-20 bg-slate-50 overflow-y-auto">

        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
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

          {/* Back */}
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>

          {/* Header */}
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Agent account
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create agent account</h1>
            <p className="text-sm text-slate-500 mt-1.5">Start listing properties and connecting with renters today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Google sign-up */}
            <a
              href="/api/auth/google?role=AGENT"
              className="flex items-center justify-center gap-2.5 w-full border border-slate-200 bg-white rounded-xl py-3.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign up with Google
            </a>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or sign up with phone</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <Field label="Full name">
              <input
                type="text" required autoFocus
                placeholder="Chukwuemeka Obi"
                value={form.fullName} onChange={set('fullName')}
                className={inputCls}
              />
            </Field>

            <Field label="Phone number">
              <input
                type="tel" required
                placeholder="+234 800 000 0000"
                value={form.phone} onChange={set('phone')}
                className={inputCls}
              />
            </Field>

            <Field label="Email address">
              <input
                type="email" required
                placeholder="you@agency.com"
                value={form.email} onChange={set('email')}
                className={inputCls}
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required minLength={8}
                  placeholder="At least 8 characters"
                  value={form.password} onChange={set('password')}
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPwd ? (
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
              </div>
            </Field>

            <Field label="Confirm password">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                value={form.confirmPassword} onChange={set('confirmPassword')}
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
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors text-sm shadow-sm shadow-emerald-900/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : 'Create agent account →'}
            </button>
          </form>

          {/* Already have account */}
          <p className="text-sm text-slate-500 mt-5 text-center">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors">
              Log in
            </Link>
          </p>

          {/* Client signup link */}
          <div className="mt-5 p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-sm">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Looking for a property?</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <Link href="/register" className="text-emerald-600 font-medium hover:underline">
                  Sign up as a client instead →
                </Link>
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
