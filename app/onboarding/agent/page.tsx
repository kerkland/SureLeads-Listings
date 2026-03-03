'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/* ─── Static data ─────────────────────────────────────── */

const LAGOS_AREAS = [
  'Ajah', 'Bariga', 'Chevron', 'Gbagada', 'Ikoyi',
  'Ikeja GRA', 'Ilupeju', 'Ketu', 'Lekki Phase 1', 'Lekki Phase 2',
  'Magodo', 'Maryland', 'Mende', 'Ogba', 'Ogudu',
  'Ojodu', 'Ojota', 'Oniru', 'Sangotedo', 'Shomolu',
  'Surulere', 'Victoria Island', 'Yaba',
];

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    price: 'Free',
    sub: 'No credit card required',
    features: [
      'Up to 5 active listings',
      'Credibility score tracking',
      'Public agent profile page',
      'Basic analytics dashboard',
    ],
    popular: false,
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    price: '₦15,000',
    sub: 'per month',
    features: [
      'Up to 25 active listings',
      'Priority placement in search',
      'Verified score badge',
      'Advanced analytics',
      'Featured on area pages',
    ],
    popular: true,
  },
  {
    id: 'AGENCY',
    name: 'Agency',
    price: '₦35,000',
    sub: 'per month',
    features: [
      'Unlimited listings',
      'Team member accounts',
      'Homepage featured placement',
      'Dedicated account manager',
      'API access',
    ],
    popular: false,
  },
];

const TOTAL_STEPS = 4;

type FormData = {
  agencyName: string;
  cacNumber: string;
  bio: string;
  primaryArea: string;
  servedAreas: string[];
  plan: string;
};

/* ─── Page ─────────────────────────────────────────────── */

export default function AgentOnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    agencyName: '',
    cacNumber: '',
    bio: '',
    primaryArea: '',
    servedAreas: [],
    plan: 'STARTER',
  });

  function toggleArea(area: string) {
    setForm((f) => ({
      ...f,
      servedAreas: f.servedAreas.includes(area)
        ? f.servedAreas.filter((a) => a !== area)
        : [...f.servedAreas, area],
    }));
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.agencyName.trim()) return 'Agency name is required.';
      if (form.bio.trim().length < 20)
        return 'Bio must be at least 20 characters.';
    }
    if (step === 2) {
      if (!form.primaryArea) return 'Please select your primary area.';
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  }

  function back() {
    setError('');
    setStep((s) => s - 1);
  }

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const token =
        typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;
      const res = await fetch('/api/agent/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error ?? 'Submission failed. Please try again.');
        return;
      }
      setDone(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 bg-sl-green-50 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-sl-green-600" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-sl-slate-900 mb-2">
          {"You're all set!"}
        </h1>
        <p className="text-sm text-sl-slate-500 max-w-sm mb-3 leading-relaxed">
          Your agent profile has been created. Our team will review your
          details and grant your verified badge once approved.
        </p>
        <p className="text-xs text-sl-slate-400 mb-8">
          This usually takes 1–2 business days.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/dashboard" className="btn-lg btn-primary">
            Go to dashboard
          </Link>
          <Link href="/listings" className="btn-lg btn-secondary">
            Browse listings
          </Link>
        </div>
      </div>
    );
  }

  /* ── Wizard ── */
  return (
    <div className="min-h-screen bg-sl-slate-50 flex flex-col">

      {/* Top bar */}
      <div className="bg-white border-b border-sl-slate-200 px-4 py-3.5
                      flex items-center justify-between">
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
        <span className="text-xs text-sl-slate-500 font-medium">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-sl-slate-200">
        <div
          className="h-0.5 bg-sl-green-500 transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-xl">

          {/* Error */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700
                            text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* ── Step 1: Agency Details ── */}
          {step === 1 && (
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-8">
              <p className="text-xs font-semibold text-sl-green-500 uppercase
                             tracking-widest mb-1">
                Step 1 of {TOTAL_STEPS}
              </p>
              <h2 className="text-xl font-bold text-sl-slate-900 mb-1">
                Agency details
              </h2>
              <p className="text-sm text-sl-slate-500 mb-7">
                Tell renters who you are and what your agency offers.
              </p>

              <div className="space-y-5">
                {/* Agency name */}
                <div>
                  <label className="block text-sm font-medium text-sl-slate-700 mb-1.5">
                    Agency name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-sl-slate-200 rounded-xl px-4 py-3
                               text-sm text-sl-slate-900 placeholder-sl-slate-400
                               focus:outline-none focus:ring-2 focus:ring-sl-green-500
                               focus:border-transparent"
                    placeholder="e.g. Okeke Properties"
                    value={form.agencyName}
                    onChange={(e) =>
                      setForm({ ...form, agencyName: e.target.value })
                    }
                  />
                </div>

                {/* CAC */}
                <div>
                  <label className="block text-sm font-medium text-sl-slate-700 mb-1.5">
                    CAC registration number
                    <span className="text-sl-slate-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-sl-slate-200 rounded-xl px-4 py-3
                               text-sm text-sl-slate-900 placeholder-sl-slate-400
                               focus:outline-none focus:ring-2 focus:ring-sl-green-500
                               focus:border-transparent"
                    placeholder="e.g. RC1234567"
                    value={form.cacNumber}
                    onChange={(e) =>
                      setForm({ ...form, cacNumber: e.target.value })
                    }
                  />
                  <p className="text-xs text-sl-slate-400 mt-1.5">
                    Adding your CAC number speeds up verified badge approval.
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-sl-slate-700 mb-1.5">
                    About you <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    maxLength={500}
                    className="w-full border border-sl-slate-200 rounded-xl px-4 py-3
                               text-sm text-sl-slate-900 placeholder-sl-slate-400
                               focus:outline-none focus:ring-2 focus:ring-sl-green-500
                               focus:border-transparent resize-none"
                    placeholder="Describe your experience, specialisations, and what makes you stand out to renters…"
                    value={form.bio}
                    onChange={(e) =>
                      setForm({ ...form, bio: e.target.value })
                    }
                  />
                  <p className="text-xs text-sl-slate-400 mt-1.5 text-right">
                    {form.bio.length} / 500
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Service Areas ── */}
          {step === 2 && (
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-8">
              <p className="text-xs font-semibold text-sl-green-500 uppercase
                             tracking-widest mb-1">
                Step 2 of {TOTAL_STEPS}
              </p>
              <h2 className="text-xl font-bold text-sl-slate-900 mb-1">
                Service areas
              </h2>
              <p className="text-sm text-sl-slate-500 mb-7">
                Where do you operate in Lagos? Renters search by area —
                the more accurate, the better.
              </p>

              <div className="space-y-6">
                {/* Primary area */}
                <div>
                  <label className="block text-sm font-medium text-sl-slate-700 mb-1.5">
                    Primary area <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-sl-slate-200 rounded-xl px-4 py-3
                               text-sm text-sl-slate-900 bg-white focus:outline-none
                               focus:ring-2 focus:ring-sl-green-500 focus:border-transparent"
                    value={form.primaryArea}
                    onChange={(e) =>
                      setForm({ ...form, primaryArea: e.target.value })
                    }
                  >
                    <option value="">Select your main area…</option>
                    {LAGOS_AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                {/* Other areas */}
                <div>
                  <label className="block text-sm font-medium text-sl-slate-700 mb-3">
                    Other areas covered
                    <span className="text-sl-slate-400 font-normal ml-1">
                      (select all that apply)
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LAGOS_AREAS.map((area) => {
                      const selected = form.servedAreas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => toggleArea(area)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border
                                      transition-colors ${
                            selected
                              ? 'bg-sl-green-50 border-sl-green-300 text-sl-green-700'
                              : 'bg-white border-sl-slate-200 text-sl-slate-600 hover:border-sl-green-300'
                          }`}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>
                  {form.servedAreas.length > 0 && (
                    <p className="text-xs text-sl-slate-400 mt-3">
                      {form.servedAreas.length} area
                      {form.servedAreas.length !== 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Choose Plan ── */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <p className="text-xs font-semibold text-sl-green-500 uppercase
                               tracking-widest mb-1">
                  Step 3 of {TOTAL_STEPS}
                </p>
                <h2 className="text-xl font-bold text-sl-slate-900 mb-1">
                  Choose your plan
                </h2>
                <p className="text-sm text-sl-slate-500">
                  Start free and upgrade anytime from your dashboard.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setForm({ ...form, plan: plan.id })}
                    className={`relative text-left border rounded-2xl p-6 transition-all ${
                      form.plan === plan.id
                        ? 'border-sl-green-500 bg-sl-green-50/40 ring-2 ring-sl-green-500/20'
                        : 'border-sl-slate-200 bg-white hover:border-sl-slate-300'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute top-4 right-4 text-xs font-semibold
                                       bg-sl-green-500 text-white px-2.5 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}

                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-semibold text-sl-slate-900">{plan.name}</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-xl font-bold text-sl-slate-900">
                            {plan.price}
                          </span>
                          <span className="text-xs text-sl-slate-400">{plan.sub}</span>
                        </div>
                      </div>
                      {/* Radio indicator */}
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
                                       flex items-center justify-center ${
                        form.plan === plan.id
                          ? 'border-sl-green-500 bg-sl-green-500'
                          : 'border-sl-slate-300'
                      }`}>
                        {form.plan === plan.id && (
                          <svg className="w-3 h-3 text-white" viewBox="0 0 20 20"
                               fill="currentColor">
                            <path fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-1.5">
                      {plan.features.map((f) => (
                        <li key={f}
                            className="flex items-center gap-2 text-xs text-sl-slate-600">
                          <svg className="w-3.5 h-3.5 text-sl-green-500 flex-shrink-0"
                               viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd" />
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-8">
              <p className="text-xs font-semibold text-sl-green-500 uppercase
                             tracking-widest mb-1">
                Step 4 of {TOTAL_STEPS}
              </p>
              <h2 className="text-xl font-bold text-sl-slate-900 mb-1">
                Review & submit
              </h2>
              <p className="text-sm text-sl-slate-500 mb-7">
                Confirm your details before we create your profile.
              </p>

              <div className="divide-y divide-sl-slate-100">
                {[
                  { label: 'Agency name',  value: form.agencyName },
                  { label: 'CAC number',   value: form.cacNumber || '—' },
                  { label: 'Bio',          value: form.bio },
                  { label: 'Primary area', value: form.primaryArea },
                  {
                    label: 'Other areas',
                    value: form.servedAreas.length
                      ? form.servedAreas.join(', ')
                      : '—',
                  },
                  {
                    label: 'Plan',
                    value: PLANS.find((p) => p.id === form.plan)?.name ?? form.plan,
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4 py-3.5">
                    <span className="text-xs font-medium text-sl-slate-500
                                     w-28 flex-shrink-0 pt-0.5">
                      {label}
                    </span>
                    <span className="text-sm text-sl-slate-900 leading-relaxed">
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-sl-slate-400 mt-6 leading-relaxed">
                By submitting you agree to our{' '}
                <Link href="/terms"
                      className="text-sl-green-600 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy"
                      className="text-sl-green-600 hover:underline">
                  Privacy Policy
                </Link>.
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            {step > 1 ? (
              <button onClick={back} className="btn-md btn-secondary">
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button onClick={next} className="btn-md btn-primary">
                Continue →
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={loading}
                className="btn-md btn-primary disabled:opacity-60"
              >
                {loading ? 'Creating profile…' : 'Create my profile →'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
