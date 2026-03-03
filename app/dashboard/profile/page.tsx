'use client';

import { useState, useEffect } from 'react';

const LAGOS_AREAS = [
  'Ajah', 'Bariga', 'Chevron', 'Gbagada', 'Ikoyi',
  'Ikeja GRA', 'Ilupeju', 'Ketu', 'Lekki Phase 1', 'Lekki Phase 2',
  'Magodo', 'Maryland', 'Mende', 'Ogba', 'Ogudu',
  'Ojodu', 'Ojota', 'Oniru', 'Sangotedo', 'Shomolu',
  'Surulere', 'Victoria Island', 'Yaba',
];

interface ProfileForm {
  agencyName:  string;
  cacNumber:   string;
  bio:         string;
  primaryArea: string;
  servedAreas: string[];
}

export default function ProfilePage() {
  const [form, setForm]       = useState<ProfileForm>({
    agencyName:  '',
    cacNumber:   '',
    bio:         '',
    primaryArea: '',
    servedAreas: [],
  });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  /* Load existing profile */
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    fetch('/api/agent-profile/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          const p = data.data;
          setForm({
            agencyName:  p.agencyName  ?? '',
            cacNumber:   p.cacNumber   ?? '',
            bio:         p.bio         ?? '',
            primaryArea: p.primaryCity ?? '',
            servedAreas: p.servedCities?.filter((c: string) => c !== p.primaryCity) ?? [],
          });
        }
      })
      .catch(() => { /* not yet onboarded — empty form is fine */ })
      .finally(() => setLoading(false));
  }, []);

  function toggleArea(area: string) {
    setForm((f) => ({
      ...f,
      servedAreas: f.servedAreas.includes(area)
        ? f.servedAreas.filter((a) => a !== area)
        : [...f.servedAreas, area],
    }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.agencyName.trim()) { setError('Agency name is required.'); return; }
    if (form.bio.trim().length < 20) { setError('Bio must be at least 20 characters.'); return; }
    if (!form.primaryArea) { setError('Primary area is required.'); return; }
    setError('');
    setSaving(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/agent/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ ...form, plan: 'STARTER' }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error ?? 'Save failed.'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-sl-slate-400 animate-pulse">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-sl-green-500 uppercase
                       tracking-widest mb-1">
          My Profile
        </p>
        <h1 className="text-2xl font-bold text-sl-slate-900">
          Agent profile
        </h1>
        <p className="text-sm text-sl-slate-500 mt-1">
          This information appears on your public agent page and listing cards.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Agency details card */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-sl-slate-900 mb-5">
            Agency details
          </h2>
          <div className="space-y-5">

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
                onChange={(e) => setForm({ ...form, agencyName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sl-slate-700 mb-1.5">
                CAC registration number
                <span className="text-sl-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="text"
                className="w-full border border-sl-slate-200 rounded-xl px-4 py-3
                           text-sm text-sl-slate-900 placeholder-sl-slate-400
                           focus:outline-none focus:ring-2 focus:ring-sl-green-500
                           focus:border-transparent"
                placeholder="e.g. RC1234567"
                value={form.cacNumber}
                onChange={(e) => setForm({ ...form, cacNumber: e.target.value })}
              />
            </div>

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
                placeholder="Describe your experience, specialisations, and what makes you stand out…"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
              <p className="text-xs text-sl-slate-400 mt-1 text-right">
                {form.bio.length} / 500
              </p>
            </div>
          </div>
        </div>

        {/* Service areas card */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-sl-slate-900 mb-5">
            Service areas
          </h2>
          <div className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-sl-slate-700 mb-1.5">
                Primary area <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full border border-sl-slate-200 rounded-xl px-4 py-3
                           text-sm text-sl-slate-900 bg-white focus:outline-none
                           focus:ring-2 focus:ring-sl-green-500 focus:border-transparent"
                value={form.primaryArea}
                onChange={(e) => setForm({ ...form, primaryArea: e.target.value })}
              >
                <option value="">Select your main area…</option>
                {LAGOS_AREAS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

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

        {/* Feedback */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm
                           px-4 py-3 rounded-xl">
            {error}
          </div>
        )}
        {saved && (
          <div className="bg-sl-green-50 border border-sl-green-200 text-sl-green-700
                           text-sm px-4 py-3 rounded-xl">
            Profile saved successfully.
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-md btn-primary disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
