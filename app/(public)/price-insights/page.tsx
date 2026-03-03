'use client';

import { useState } from 'react';
import type { PropertyType, PriceInsightResponse, PriceDataQualityFlag } from '@/types';

/* ─── Static data ────────────────────────────────────────────────────────── */

const AREAS = [
  'Lekki Phase 1', 'Lekki Phase 2', 'Victoria Island', 'Ikoyi', 'Banana Island',
  'Ajah', 'Sangotedo', 'Chevron', 'Osapa London',
  'Ikeja GRA', 'Ikeja', 'Maryland', 'Gbagada', 'Yaba',
  'Surulere', 'Magodo', 'Ojodu', 'Ogba', 'Ketu',
];

const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'FLAT',      label: 'Flat'      },
  { value: 'DUPLEX',    label: 'Duplex'    },
  { value: 'ROOM',      label: 'Room S/C'  },
  { value: 'BUNGALOW',  label: 'Bungalow'  },
  { value: 'TERRACED',  label: 'Terraced'  },
];

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmtNaira(kobo: number) {
  const n = kobo / 100;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

function TrendPill({ direction, pct }: { direction: string | null; pct: number | null }) {
  if (!direction || direction === 'STABLE') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium
                       text-sl-slate-500 bg-sl-slate-100 rounded-full px-2.5 py-1">
        <span>→</span> Stable
      </span>
    );
  }
  const up = direction === 'UP';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${
      up
        ? 'text-red-700 bg-red-50'
        : 'text-sl-green-700 bg-sl-green-50'
    }`}>
      <span>{up ? '↑' : '↓'}</span>
      {pct !== null ? `${up ? '+' : ''}${pct}%` : direction}
      <span className="font-normal opacity-70">vs prev 30d</span>
    </span>
  );
}

const FLAG_COPY: Record<PriceDataQualityFlag, { label: string; desc: string }> = {
  LOW_VOLUME:       { label: 'Low volume',        desc: 'Fewer than 5 listings — treat median as indicative only.' },
  SINGLE_AGENT:     { label: 'Single agent',       desc: 'All data from one agent. May not reflect the full market.' },
  DOMINATED_MARKET: { label: 'Concentrated market', desc: 'One agent accounts for more than half of all data points.' },
};

function QualityWarnings({ flags }: { flags: PriceDataQualityFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <div className="space-y-2">
      {flags.map((f) => (
        <div key={f}
             className="flex items-start gap-2.5 bg-sl-gold-50 border border-sl-gold-200
                        rounded-lg px-3.5 py-2.5">
          <svg className="w-4 h-4 text-sl-gold-600 flex-shrink-0 mt-0.5"
               viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-xs font-semibold text-sl-gold-800">{FLAG_COPY[f].label}</p>
            <p className="text-xs text-sl-gold-700 mt-0.5">{FLAG_COPY[f].desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function PriceInsightsPage() {
  const [area,         setArea]         = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [bedrooms,     setBedrooms]     = useState('');
  const [result,       setResult]       = useState<PriceInsightResponse | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!area || !propertyType) return;
    setLoading(true);
    setError('');
    setResult(null);

    const params = new URLSearchParams({ city: 'Lagos', area, propertyType, bedrooms: bedrooms || '-1' });
    try {
      const res = await fetch('/api/price-insights?' + params.toString());
      const json = await res.json();
      if (json.success) setResult(json.data);
      else setError(json.error ?? 'Something went wrong.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const data = result?.available ? result : null;

  return (
    <div className="min-h-screen bg-sl-slate-50">

      {/* ── Page header ── */}
      <div className="bg-white border-b border-sl-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-2">
            Market intelligence
          </p>
          <h1 className="text-2xl font-bold text-sl-slate-900 mb-1">Area Price Insights</h1>
          <p className="text-sm text-sl-slate-500 max-w-lg">
            Rental medians from verified, weekly-reconfirmed listings — 30-day rolling window.
            Outliers removed.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Search form ── */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <form onSubmit={search} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Area / Neighbourhood</label>
                <select value={area} onChange={(e) => setArea(e.target.value)} className="select w-full">
                  <option value="">Select area</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Property Type</label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                  className="select w-full"
                >
                  <option value="">Select type</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Bedrooms <span className="text-sl-slate-400 font-normal">(optional)</span></label>
                <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="select w-full">
                  <option value="">Any</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} bed{n !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !area || !propertyType}
              className="btn-md btn-primary w-full justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                            stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Searching…
                </span>
              ) : 'Get price insights'}
            </button>
          </form>
        </div>

        {/* ── No data ── */}
        {result && !result.available && (
          <div className="bg-white border border-sl-slate-200 rounded-2xl p-8 text-center">
            <div className="w-10 h-10 bg-sl-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
              <svg className="w-5 h-5 text-sl-slate-400" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-sl-slate-700 mb-1">Not enough data yet</p>
            <p className="text-xs text-sl-slate-500">
              We need at least 3 verified listings from 2 different agents
              to publish price insights for this area.
            </p>
          </div>
        )}

        {/* ── Results ── */}
        {data && (
          <div className="space-y-4">

            {/* Fallback banner */}
            {data.isFallback && data.fallbackLabel && (
              <div className="flex items-center gap-2 bg-sl-slate-100 border border-sl-slate-200
                              rounded-lg px-4 py-2.5 text-xs text-sl-slate-600">
                <svg className="w-3.5 h-3.5 text-sl-slate-400 flex-shrink-0"
                     viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd" />
                </svg>
                Showing {data.fallbackLabel} — no exact data for this selection yet.
              </div>
            )}

            {/* Main price card */}
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-6 space-y-5">

              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-sl-slate-900">{data.area}</p>
                  <p className="text-xs text-sl-slate-500 mt-0.5">
                    {data.city} · {data.propertyType}
                    {data.bedrooms !== -1 && ` · ${data.bedrooms} bed${data.bedrooms !== 1 ? 's' : ''}`}
                  </p>
                </div>
                <TrendPill direction={data.trendDirection} pct={data.priceChangePercent} />
              </div>

              {/* Price tiles */}
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { label: 'P25 (lower)',  value: data.p25RentPerYear,    highlight: false },
                  { label: 'Median',       value: data.medianRentPerYear, highlight: true  },
                  { label: 'P75 (upper)',  value: data.p75RentPerYear,    highlight: false },
                ].map(({ label, value, highlight }) => (
                  <div
                    key={label}
                    className={`rounded-xl px-3 py-4 ${
                      highlight
                        ? 'bg-sl-green-50 border-2 border-sl-green-200'
                        : 'bg-sl-slate-50 border border-sl-slate-200'
                    }`}
                  >
                    <p className={`text-2xs mb-1 ${highlight ? 'text-sl-green-600' : 'text-sl-slate-500'}`}>
                      {label}
                    </p>
                    <p className={`font-bold leading-tight ${
                      highlight ? 'text-sl-green-700 text-lg' : 'text-sl-slate-800 text-base'
                    }`}>
                      {fmtNaira(value)}
                    </p>
                    <p className="text-2xs text-sl-slate-400 mt-0.5">/yr</p>
                  </div>
                ))}
              </div>

              {/* Previous median + range */}
              <div className="border-t border-sl-slate-100 pt-4 grid grid-cols-2 gap-4 text-xs text-sl-slate-500">
                <div>
                  <p className="text-2xs font-semibold text-sl-slate-400 uppercase tracking-wide mb-1">
                    Price range
                  </p>
                  <p className="font-medium text-sl-slate-700">
                    {fmtNaira(data.minRentPerYear)} – {fmtNaira(data.maxRentPerYear)}
                  </p>
                </div>
                {data.previousMedianRentPerYear !== null && (
                  <div>
                    <p className="text-2xs font-semibold text-sl-slate-400 uppercase tracking-wide mb-1">
                      Prev 30-day median
                    </p>
                    <p className="font-medium text-sl-slate-700">
                      {fmtNaira(data.previousMedianRentPerYear)}
                    </p>
                  </div>
                )}
              </div>

              {/* Confidence bar */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-2xs font-semibold text-sl-slate-400 uppercase tracking-wide">
                    Data confidence
                  </p>
                  <p className="text-2xs text-sl-slate-500">
                    {Math.round(data.confidenceScore * 100)}%
                    <span className="text-sl-slate-400 ml-1">
                      · {data.listingCount} listing{data.listingCount !== 1 ? 's' : ''},&nbsp;
                      {data.agentCount} agent{data.agentCount !== 1 ? 's' : ''}
                    </span>
                  </p>
                </div>
                <div className="h-1.5 bg-sl-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      data.confidenceScore >= 0.7
                        ? 'bg-sl-green-500'
                        : data.confidenceScore >= 0.4
                        ? 'bg-sl-gold-500'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.round(data.confidenceScore * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Quality warnings */}
            <QualityWarnings flags={data.dataQualityFlags} />

            {/* Methodology note */}
            <p className="text-2xs text-sl-slate-400 text-center px-4">
              Data source: VERIFIED listings reconfirmed in the last 30 days.
              Outliers removed via IQR method. Requires ≥ 3 listings from ≥ 2 agents.
              Updated weekly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
