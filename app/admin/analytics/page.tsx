'use client';

import { useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface WeekBucket { label: string; count: number; }
interface CategoryRow { category: string; count: number; }
interface AreaRow     { area: string;     count: number; }
interface TierRow     { tier: string;     count: number; }

interface Analytics {
  summary:             { totalListings: number; totalAgents: number; totalUsers: number; activeListings: number; totalReviews: number };
  listingsByWeek:      WeekBucket[];
  agentsByWeek:        WeekBucket[];
  complaintsByWeek:    WeekBucket[];
  listingsByCategory:  CategoryRow[];
  listingsByArea:      AreaRow[];
  agentsByTier:        TierRow[];
}

/* ─── Mini components ─────────────────────────────────────────────────────── */

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="bg-white border border-sl-slate-200 rounded-xl p-5">
      <p className="text-2xl font-bold text-sl-slate-900">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-xs text-sl-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function BarChart({ data, color, height = 160 }: { data: WeekBucket[]; color: string; height?: number }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <span className="text-2xs text-sl-slate-400 leading-none">{d.count > 0 ? d.count : ''}</span>
          <div
            className="w-full rounded-t-sm transition-all"
            style={{ height: `${Math.max((d.count / max) * 100, d.count > 0 ? 4 : 0)}%`, backgroundColor: color }}
          />
          <span className="text-2xs text-sl-slate-400 text-center leading-tight truncate w-full text-center">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function HBarChart({ data, color }: { data: { label: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="space-y-2">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-2">
          <span className="text-xs text-sl-slate-500 w-32 truncate flex-shrink-0">{d.label}</span>
          <div className="flex-1 bg-sl-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(d.count / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs text-sl-slate-500 w-8 text-right flex-shrink-0">{d.count}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

const CAT_COLORS: Record<string, string> = {
  FOR_RENT:  'bg-sl-green-50 text-sl-green-700 border border-sl-green-200',
  FOR_SALE:  'bg-blue-50 text-blue-700 border border-blue-200',
  SHORT_LET: 'bg-purple-50 text-purple-700 border border-purple-200',
};

const TIER_COLORS: Record<string, string> = {
  STARTER:      '#94a3b8',
  PROFESSIONAL: '#22c55e',
  AGENCY:       '#a855f7',
};

export default function AnalyticsPage() {
  const [data,    setData]    = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((res) => { if (res.success) setData(res.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-sl-slate-900">Analytics</h1>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-sl-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-sm text-sl-slate-500">Unable to load analytics. Check DB connection.</p>
      </div>
    );
  }

  const s = data.summary;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Analytics &amp; Reports</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">Platform-wide metrics · last 8 weeks</p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        <StatTile value={s.totalListings}  label="Total listings"    />
        <StatTile value={s.activeListings} label="Active listings"   />
        <StatTile value={s.totalAgents}    label="Registered agents" />
        <StatTile value={s.totalUsers}     label="Client users"      />
        <StatTile value={s.totalReviews}   label="Reviews"           />
      </div>

      {/* Time-series charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* Listings by week */}
        <div className="lg:col-span-2 bg-white border border-sl-slate-200 rounded-2xl p-6">
          <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-1">
            New listings per week
          </p>
          <p className="text-xl font-bold text-sl-slate-900 mb-5">
            {data.listingsByWeek.reduce((a, b) => a + b.count, 0)} in 8 weeks
          </p>
          <BarChart data={data.listingsByWeek} color="#22c55e" />
        </div>

        {/* Agents by week */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-1">
            New agents per week
          </p>
          <p className="text-xl font-bold text-sl-slate-900 mb-5">
            {data.agentsByWeek.reduce((a, b) => a + b.count, 0)} in 8 weeks
          </p>
          <BarChart data={data.agentsByWeek} color="#6366f1" />
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* Complaints by week */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-1">
            Complaints per week
          </p>
          <p className="text-xl font-bold text-sl-slate-900 mb-5">
            {data.complaintsByWeek.reduce((a, b) => a + b.count, 0)} in 8 weeks
          </p>
          <BarChart data={data.complaintsByWeek} color="#ef4444" height={120} />
        </div>

        {/* Listings by category */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-4">
            Listings by category
          </p>
          {data.listingsByCategory.length === 0 ? (
            <p className="text-sm text-sl-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.listingsByCategory.map((c) => {
                const total = data.listingsByCategory.reduce((a, b) => a + b.count, 0);
                const pct   = total > 0 ? Math.round((c.count / total) * 100) : 0;
                return (
                  <div key={c.category} className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CAT_COLORS[c.category] ?? 'bg-sl-slate-100 text-sl-slate-600'}`}>
                      {c.category.replace('_', ' ')}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-sl-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-sl-green-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-sl-slate-500 w-10 text-right">{c.count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top areas */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-4">
            Top 10 areas by listings
          </p>
          {data.listingsByArea.length === 0 ? (
            <p className="text-sm text-sl-slate-400">No data yet.</p>
          ) : (
            <HBarChart data={data.listingsByArea.map((a) => ({ label: a.area, count: a.count }))} color="#22c55e" />
          )}
        </div>

        {/* Agents by subscription tier */}
        <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
          <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-4">
            Agents by subscription tier
          </p>
          {data.agentsByTier.length === 0 ? (
            <p className="text-sm text-sl-slate-400">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {data.agentsByTier.map((t) => {
                const total = data.agentsByTier.reduce((a, b) => a + b.count, 0);
                const pct   = total > 0 ? Math.round((t.count / total) * 100) : 0;
                return (
                  <div key={t.tier} className="flex items-center gap-3">
                    <span className="text-xs text-sl-slate-600 w-24 flex-shrink-0">{t.tier}</span>
                    <div className="flex-1 bg-sl-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: TIER_COLORS[t.tier] ?? '#94a3b8' }} />
                    </div>
                    <span className="text-xs text-sl-slate-500 w-8 text-right">{t.count}</span>
                    <span className="text-xs text-sl-slate-400 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
