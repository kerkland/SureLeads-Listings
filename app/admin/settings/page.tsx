'use client';

import { useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Settings {
  reconfirmationDays:       number;
  gracePeriodDays:          number;
  priceThresholdMultiplier: number;
  maxListingsPerTier: {
    STARTER:      number;
    PROFESSIONAL: number;
    AGENCY:       number;
  };
  inspectionResponseHours: number;
  featuredAreas: string[];
}

/* ─── SettingCard wrapper ─────────────────────────────────────────────────── */

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
      <h2 className="text-sm font-semibold text-sl-slate-900 mb-0.5">{title}</h2>
      <p className="text-xs text-sl-slate-400 mb-5">{desc}</p>
      {children}
    </div>
  );
}

function NumberInput({
  label, value, min, max, step = 1, onChange,
}: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <label className="text-xs text-sl-slate-600">{label}</label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 text-sm text-right border border-sl-slate-200 rounded-lg px-2.5 py-1.5
                   focus:outline-none focus:ring-2 focus:ring-sl-green-300"
      />
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [draft,    setDraft]    = useState<Settings | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [err,      setErr]      = useState('');
  const [newArea,  setNewArea]  = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) { setSettings(res.data); setDraft(res.data); }
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!draft) return;
    setSaving(true);
    setSaved(false);
    setErr('');
    const res = await fetch('/api/admin/settings', {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(draft),
    }).then((r) => r.json());
    setSaving(false);
    if (res.success) { setSettings(res.data); setDraft(res.data); setSaved(true); setTimeout(() => setSaved(false), 3000); }
    else setErr(typeof res.error === 'string' ? res.error : 'Failed to save settings');
  }

  function updateDraft(patch: Partial<Settings>) {
    setDraft((d) => d ? { ...d, ...patch } : d);
  }

  function addArea() {
    const trimmed = newArea.trim();
    if (!trimmed || !draft) return;
    if (draft.featuredAreas.includes(trimmed)) return;
    updateDraft({ featuredAreas: [...draft.featuredAreas, trimmed] });
    setNewArea('');
  }

  function removeArea(area: string) {
    if (!draft) return;
    updateDraft({ featuredAreas: draft.featuredAreas.filter((a) => a !== area) });
  }

  const isDirty = JSON.stringify(draft) !== JSON.stringify(settings);

  if (loading || !draft) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-sl-slate-900">Platform Settings</h1>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-sl-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-sl-slate-900">Platform Settings</h1>
          <p className="text-sm text-sl-slate-500 mt-0.5">Configure platform-wide parameters.</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-sl-green-600 font-medium">✓ Saved</span>}
          <button
            onClick={save}
            disabled={!isDirty || saving}
            className="px-4 py-2 text-sm font-medium bg-sl-green-500 text-white rounded-lg
                       hover:bg-sl-green-600 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {err && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{err}</div>
      )}

      <div className="space-y-5">

        {/* Reconfirmation settings */}
        <Card
          title="Reconfirmation cycle"
          desc="How often VERIFIED listings must be reconfirmed by the agent."
        >
          <NumberInput
            label="Reconfirmation period (days)"
            value={draft.reconfirmationDays}
            min={1} max={30}
            onChange={(v) => updateDraft({ reconfirmationDays: v })}
          />
          <NumberInput
            label="Grace period after missed reconfirmation (days)"
            value={draft.gracePeriodDays}
            min={1} max={14}
            onChange={(v) => updateDraft({ gracePeriodDays: v })}
          />
          <NumberInput
            label="Inspection response window (hours)"
            value={draft.inspectionResponseHours}
            min={1} max={168}
            onChange={(v) => updateDraft({ inspectionResponseHours: v })}
          />
        </Card>

        {/* Price monitoring */}
        <Card
          title="Price monitoring"
          desc="Listings priced above (area median × threshold) are flagged as suspicious."
        >
          <NumberInput
            label="Suspicious price multiplier (× area median)"
            value={draft.priceThresholdMultiplier}
            min={1} max={10} step={0.5}
            onChange={(v) => updateDraft({ priceThresholdMultiplier: v })}
          />
          <p className="text-xs text-sl-slate-400 mt-1">
            e.g. 3.0 = listing price &gt; 3× area median triggers a suspicious-price flag.
          </p>
        </Card>

        {/* Listing limits */}
        <Card
          title="Listing limits per subscription tier"
          desc="Maximum active listings an agent can have per tier."
        >
          <NumberInput
            label="Starter — max listings"
            value={draft.maxListingsPerTier.STARTER}
            min={1} max={1000}
            onChange={(v) => updateDraft({ maxListingsPerTier: { ...draft.maxListingsPerTier, STARTER: v } })}
          />
          <NumberInput
            label="Professional — max listings"
            value={draft.maxListingsPerTier.PROFESSIONAL}
            min={1} max={1000}
            onChange={(v) => updateDraft({ maxListingsPerTier: { ...draft.maxListingsPerTier, PROFESSIONAL: v } })}
          />
          <NumberInput
            label="Agency — max listings"
            value={draft.maxListingsPerTier.AGENCY}
            min={1} max={1000}
            onChange={(v) => updateDraft({ maxListingsPerTier: { ...draft.maxListingsPerTier, AGENCY: v } })}
          />
        </Card>

        {/* Featured areas */}
        <Card
          title="Featured areas"
          desc="Areas shown on the homepage and in area browse sections."
        >
          <div className="flex flex-wrap gap-2 mb-4">
            {draft.featuredAreas.map((area) => (
              <span
                key={area}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
                           bg-sl-green-50 text-sl-green-700 border border-sl-green-200"
              >
                {area}
                <button
                  onClick={() => removeArea(area)}
                  className="text-sl-green-500 hover:text-red-500 transition-colors font-bold leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addArea(); } }}
              placeholder="Add area name…"
              className="flex-1 text-sm border border-sl-slate-200 rounded-lg px-3 py-1.5
                         focus:outline-none focus:ring-2 focus:ring-sl-green-300"
            />
            <button
              onClick={addArea}
              className="text-sm px-3 py-1.5 bg-sl-green-500 text-white rounded-lg hover:bg-sl-green-600 transition-colors"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-sl-slate-400 mt-2">
            {draft.featuredAreas.length}/20 areas · Press Enter or click Add
          </p>
        </Card>

      </div>

      {/* Sticky save reminder */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-sl-slate-900 text-white
                        px-4 py-3 rounded-xl shadow-lg text-sm">
          <span>You have unsaved changes</span>
          <button
            onClick={save}
            disabled={saving}
            className="px-3 py-1 bg-sl-green-500 text-white rounded-lg text-xs font-semibold
                       hover:bg-sl-green-600 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}
