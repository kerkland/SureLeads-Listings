'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ─── Benefits data ────────────────────────────────────── */

const BENEFITS = [
  {
    title: 'Claim your FREE agent profile',
    desc:  'Show up when Lagos renters search for a trusted agent in your area.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3
             3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Generate and manage leads',
    desc:  'Connect with renters who book property inspections through SureLeads.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0
             01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8
             9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: 'Build your credibility',
    desc:  'Earn a Credibility Score and badge — top-rated agents attract more enquiries.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0
             3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806
             1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0
             01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42
             3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-
             1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0
             013.138-3.138z" />
      </svg>
    ),
  },
  {
    title: 'List and manage properties',
    desc:  'Post verified listings, add video walkthroughs, and track performance.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0
             01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001
             1m-6 0h6" />
      </svg>
    ),
  },
];

/* ─── Field helpers ────────────────────────────────────── */

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

/* ─── SureLeads Logo ───────────────────────────────────── */

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="flex gap-0.5">
        <div className="w-3.5 h-3.5 bg-sl-green-600 rounded-sm" />
        <div className="w-3.5 h-3.5 bg-sl-gold-400 rounded-sm opacity-70" />
      </div>
      <span className="font-bold text-sl-slate-900 text-sm">
        SureLeads{' '}
        <span className="font-normal text-sl-slate-400">Listings</span>
      </span>
    </Link>
  );
}

/* ─── Page ──────────────────────────────────────────────── */

export default function AgentRegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: '', phone: '', email: '', password: '', confirmPassword: '',
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
    <div className="flex min-h-screen">

      {/* ══ LEFT: Benefits panel ══════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] bg-sl-slate-100
                       flex-col px-10 py-10 xl:px-14">
        {/* Logo */}
        <div className="mb-12">
          <Logo />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-sl-slate-900 leading-snug mb-10">
          Your SureLeads Listings agent<br />account allows you to:
        </h2>

        {/* Feature list */}
        <div className="space-y-7">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex items-start gap-4">
              {/* Icon badge */}
              <div className="w-11 h-11 bg-sl-green-100 rounded-full flex items-center
                               justify-center flex-shrink-0 text-sl-green-600">
                {b.icon}
              </div>
              <div>
                <p className="font-bold text-sl-slate-900 text-[15px] mb-0.5">{b.title}</p>
                <p className="text-sm text-sl-slate-500 leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="mt-auto pt-12">
          <p className="text-xs text-sl-slate-400 leading-relaxed">
            By creating an account you agree to SureLeads&apos;s{' '}
            <Link href="/terms" className="underline hover:text-sl-slate-600 transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-sl-slate-600 transition-colors">
              Privacy Policy
            </Link>.
          </p>
        </div>
      </div>

      {/* ══ RIGHT: Form panel ════════════════════════════════ */}
      <div className="flex-1 bg-white flex flex-col justify-center
                       px-6 sm:px-10 py-12 lg:px-14 xl:px-20">

        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Logo />
        </div>

        <div className="w-full max-w-[22rem] mx-auto">

          {/* Back link */}
          <Link href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-sl-slate-500
                           hover:text-sl-slate-900 transition-colors mb-7">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to login
          </Link>

          <h1 className="text-2xl font-bold text-sl-slate-900 mb-1">
            Create agent account
          </h1>
          <p className="text-sm text-sl-slate-400 mb-7">
            Start listing properties and connecting with renters today.
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
                placeholder="you@agency.com"
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

          {/* Already have account */}
          <p className="text-sm text-sl-slate-500 mt-5 text-center">
            Already have an account?{' '}
            <Link href="/login"
                  className="font-semibold text-sl-slate-900 underline underline-offset-2
                             hover:text-sl-green-700 transition-colors">
              Log in
            </Link>
          </p>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 border-t border-sl-slate-200" />
            <span className="text-xs text-sl-slate-400">or</span>
            <div className="flex-1 border-t border-sl-slate-200" />
          </div>

          {/* Client signup CTA */}
          <Link
            href="/register"
            className="flex items-center justify-center gap-2 w-full border border-sl-slate-200
                       rounded-xl py-3.5 text-sm font-medium text-sl-slate-700
                       hover:bg-sl-slate-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1
                   1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1
                   1 0 001 1m-6 0h6" />
            </svg>
            Looking for a property? Sign up
          </Link>

        </div>
      </div>

    </div>
  );
}
