'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { PropertyType, PriceInsightResponse } from '@/types';

interface Props {
  city:        string;
  area:        string;
  propertyType: PropertyType;
  bedrooms:    number;
  currentRent: number; // in kobo
}

function fmtNaira(kobo: number) {
  const n = kobo / 100;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  return `₦${n.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function PriceInsightWidget({ city, area, propertyType, bedrooms, currentRent }: Props) {
  const [data,    setData]    = useState<PriceInsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed,  setAuthed]  = useState(true);

  useEffect(() => {
    const url = `/api/price-insights?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}&propertyType=${propertyType}&bedrooms=${bedrooms}`;
    fetch(url)
      .then(async (res) => {
        if (res.status === 401) { setAuthed(false); return; }
        const json = await res.json();
        setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, area, propertyType, bedrooms]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="border border-sl-slate-200 rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-sl-slate-100 rounded w-2/5 mb-3" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-12 bg-sl-slate-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ── Auth gate ── */
  if (!authed) {
    return (
      <div className="border border-sl-slate-200 rounded-2xl p-4 flex items-center gap-3">
        <svg className="w-5 h-5 text-sl-slate-400 flex-shrink-0" fill="none"
             stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <p className="text-sm text-sl-slate-600">
          <Link href="/login" className="font-semibold text-sl-green-600 hover:underline">
            Sign in
          </Link>{' '}
          to see area price insights for {area}.
        </p>
      </div>
    );
  }

  if (!data || !data.available) return null;

  /* ── vs-median calculation ── */
  const ratioPct  = Math.round((currentRent / data.medianRentPerYear) * 100);
  const above     = ratioPct > 100;
  const diffPct   = above ? ratioPct - 100 : 100 - ratioPct;
  const vsLabel   = diffPct === 0
    ? 'at the area median'
    : above
    ? `+${diffPct}% above median`
    : `${diffPct}% below median`;

  /* ── Trend indicator ── */
  const trend     = data.trendDirection;
  const trendPct  = data.priceChangePercent;
  const trendUp   = trend === 'UP';
  const trendDown = trend === 'DOWN';

  /* ── Fallback label ── */
  const heading = data.isFallback && data.fallbackLabel
    ? data.fallbackLabel
    : `${area} price data`;

  return (
    <div className="border border-sl-slate-200 rounded-2xl p-5 space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-sl-slate-900">{heading}</h4>
          <p className="text-2xs text-sl-slate-400 mt-0.5">
            {data.listingCount} verified listing{data.listingCount !== 1 ? 's' : ''}
            &nbsp;· {data.agentCount} agent{data.agentCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Trend pill */}
        {trend && (
          <span className={`inline-flex items-center gap-1 text-2xs font-medium rounded-full px-2 py-1 flex-shrink-0 ${
            trendUp
              ? 'bg-red-50 text-red-700'
              : trendDown
              ? 'bg-sl-green-50 text-sl-green-700'
              : 'bg-sl-slate-100 text-sl-slate-500'
          }`}>
            {trendUp ? '↑' : trendDown ? '↓' : '→'}
            {trendPct !== null
              ? ` ${trendUp ? '+' : ''}${trendPct}%`
              : trend.charAt(0) + trend.slice(1).toLowerCase()
            }
          </span>
        )}
      </div>

      {/* Price tiles: P25 / Median / P75 */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'P25',    value: data.p25RentPerYear,    hi: false },
          { label: 'Median', value: data.medianRentPerYear, hi: true  },
          { label: 'P75',    value: data.p75RentPerYear,    hi: false },
        ].map(({ label, value, hi }) => (
          <div
            key={label}
            className={`rounded-xl px-2 py-3 ${
              hi
                ? 'bg-sl-green-50 border border-sl-green-200'
                : 'bg-sl-slate-50 border border-sl-slate-200'
            }`}
          >
            <p className={`text-2xs mb-0.5 ${hi ? 'text-sl-green-600' : 'text-sl-slate-500'}`}>
              {label}
            </p>
            <p className={`font-bold text-sm leading-tight ${
              hi ? 'text-sl-green-700' : 'text-sl-slate-800'
            }`}>
              {fmtNaira(value)}
            </p>
          </div>
        ))}
      </div>

      {/* This listing vs median */}
      {diffPct !== undefined && (
        <p className="text-xs text-sl-slate-500">
          This listing is{' '}
          <span className={`font-semibold ${
            diffPct === 0
              ? 'text-sl-slate-700'
              : above
              ? 'text-red-600'
              : 'text-sl-green-600'
          }`}>
            {vsLabel}
          </span>
          .
        </p>
      )}

      {/* Confidence bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-2xs text-sl-slate-400 font-medium uppercase tracking-wide">
            Data confidence
          </span>
          <span className="text-2xs text-sl-slate-500">
            {Math.round(data.confidenceScore * 100)}%
          </span>
        </div>
        <div className="h-1 bg-sl-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
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
  );
}
