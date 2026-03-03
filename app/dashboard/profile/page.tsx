'use client';

import { useState, useEffect, useRef } from 'react';

const LAGOS_AREAS = [
  'Ajah', 'Bariga', 'Chevron', 'Gbagada', 'Ikoyi',
  'Ikeja GRA', 'Ilupeju', 'Ketu', 'Lekki Phase 1', 'Lekki Phase 2',
  'Magodo', 'Maryland', 'Mende', 'Ogba', 'Ogudu',
  'Ojodu', 'Ojota', 'Oniru', 'Sangotedo', 'Shomolu',
  'Surulere', 'Victoria Island', 'Yaba',
];

interface ProfileForm {
  agencyName:   string;
  cacNumber:    string;
  bio:          string;
  primaryArea:  string;
  servedAreas:  string[];
  profilePhoto: string; // base64 data URL or empty string
}

/** Resize + compress an image File to a square-ish JPEG data URL (max 256px). */
function compressPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const MAX = 256;
        const scale = Math.min(MAX / img.width, MAX / img.height, 1);
        const w = Math.round(img.width  * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width  = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>({
    agencyName:   '',
    cacNumber:    '',
    bio:          '',
    primaryArea:  '',
    servedAreas:  [],
    profilePhoto: '',
  });
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
            agencyName:   p.agencyName  ?? '',
            cacNumber:    p.cacNumber   ?? '',
            bio:          p.bio         ?? '',
            primaryArea:  p.primaryCity ?? '',
            servedAreas:  p.servedCities?.filter((c: string) => c !== p.primaryCity) ?? [],
            profilePhoto: p.profilePhoto ?? '',
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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Photo must be smaller than 5 MB.');
      return;
    }
    setPhotoLoading(true);
    setError('');
    try {
      const dataUrl = await compressPhoto(file);
      setForm((f) => ({ ...f, profilePhoto: dataUrl }));
    } catch {
      setError('Could not process image. Please try a different file.');
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
        body: JSON.stringify({
          ...form,
          plan: 'STARTER',
          profilePhoto: form.profilePhoto || undefined,
        }),
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

  const initials = form.agencyName
    ? form.agencyName[0].toUpperCase()
    : '?';

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

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

        {/* ── Profile photo card ───────────────────────────────────── */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-sl-slate-900 mb-5">
            Profile photo
          </h2>
          <div className="flex items-center gap-5">

            {/* Avatar preview */}
            <div className="relative flex-shrink-0">
              {form.profilePhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.profilePhoto}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2
                             border-sl-green-200 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-sl-green-100 flex
                                items-center justify-center border-2 border-sl-green-200">
                  <span className="text-2xl font-bold text-sl-green-700">
                    {initials}
                  </span>
                </div>
              )}
              {photoLoading && (
                <div className="absolute inset-0 rounded-full bg-white/70
                                flex items-center justify-center">
                  <svg className="w-5 h-5 animate-spin text-sl-green-500"
                       fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
            </div>

            {/* Upload controls */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-sl-slate-700 font-medium mb-1">
                Upload a clear photo of yourself
              </p>
              <p className="text-xs text-sl-slate-400 mb-3">
                JPG, PNG or WEBP · Max 5 MB · Appears on your listing cards
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoLoading}
                  className="px-4 py-2 text-sm font-medium rounded-xl border
                             border-sl-slate-200 bg-white text-sl-slate-700
                             hover:bg-sl-slate-50 hover:border-sl-slate-300
                             transition-colors disabled:opacity-50"
                >
                  {form.profilePhoto ? 'Change photo' : 'Upload photo'}
                </button>
                {form.profilePhoto && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, profilePhoto: '' }))}
                    className="text-xs text-red-500 hover:text-red-700
                               transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
          </div>
        </div>

        {/* ── Agency details card ──────────────────────────────────── */}
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

        {/* ── Service areas card ───────────────────────────────────── */}
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
