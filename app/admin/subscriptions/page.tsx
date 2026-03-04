'use client';

import React, { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AgentSub {
  agentId:               string;
  userId:                string;
  fullName:              string;
  phone:                 string;
  email:                 string | null;
  agencyName:            string | null;
  subscriptionTier:      string;
  subscriptionExpiresAt: string | null;
  listingCount:          number;
  isVerifiedBadge:       boolean;
  isSuspended:           boolean;
  createdAt:             string;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const SUB_COLORS: Record<string, string> = {
  AGENCY:       'bg-purple-50 text-purple-700 border border-purple-200',
  PROFESSIONAL: 'bg-sl-green-50 text-sl-green-700 border border-sl-green-200',
  STARTER:      'bg-sl-slate-100 text-sl-slate-500 border border-sl-slate-200',
};

function fmtDate(s: string) {
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ─── Inline change-tier form ────────────────────────────────────────────── */

function TierForm({ agent, onClose, onSaved }: { agent: AgentSub; onClose: () => void; onSaved: () => void }) {
  const [tier, setTier] = useState(agent.subscriptionTier);
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  async function save() {
    setBusy(true);
    setErr('');
    const res = await fetch(`/api/admin/subscriptions/${agent.agentId}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ tier }),
    }).then((r) => r.json());
    setBusy(false);
    if (res.success) { onSaved(); onClose(); }
    else setErr(typeof res.error === 'string' ? res.error : 'Failed');
  }

  return (
    <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-4 mt-1">
      <p className="text-xs font-semibold text-sl-slate-700 mb-3">Change subscription tier</p>
      <div className="flex items-center gap-3 flex-wrap">
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="text-xs border border-sl-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
        >
          <option value="STARTER">Starter</option>
          <option value="PROFESSIONAL">Professional</option>
          <option value="AGENCY">Agency</option>
        </select>
        <button
          onClick={save}
          disabled={busy || tier === agent.subscriptionTier}
          className="text-xs px-3 py-1.5 bg-sl-green-500 text-white rounded-lg
                     hover:bg-sl-green-600 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Saving…' : 'Confirm'}
        </button>
        <button onClick={onClose} className="text-xs text-sl-slate-400 hover:text-sl-slate-600">
          Cancel
        </button>
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function SubscriptionsPage() {
  const [agents,      setAgents]      = useState<AgentSub[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [filter,      setFilter]      = useState('');
  const [tierSummary, setTierSummary] = useState<Record<string, number>>({});
  const [loading,     setLoading]     = useState(true);
  const [changingId,  setChangingId]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs  = new URLSearchParams({ page: String(page), limit: '25', ...(filter ? { tier: filter } : {}) });
    const res = await fetch(`/api/admin/subscriptions?${qs}`).then((r) => r.json());
    if (res.success) {
      setAgents(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages ?? 1);
      setTierSummary(res.tierSummary ?? {});
    }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    const rows = [
      ['Name', 'Agency', 'Phone', 'Tier', 'Listings', 'Verified', 'Joined'],
      ...agents.map((a) => [
        a.fullName, a.agencyName ?? '', a.phone,
        a.subscriptionTier, String(a.listingCount),
        a.isVerifiedBadge ? 'Yes' : 'No',
        fmtDate(a.createdAt),
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'subscriptions.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const TABS = [
    { value: '',             label: 'All' },
    { value: 'STARTER',      label: `Starter (${tierSummary.STARTER ?? 0})` },
    { value: 'PROFESSIONAL', label: `Professional (${tierSummary.PROFESSIONAL ?? 0})` },
    { value: 'AGENCY',       label: `Agency (${tierSummary.AGENCY ?? 0})` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-sl-slate-900">Subscriptions</h1>
          <p className="text-sm text-sl-slate-500 mt-0.5">Manage agent subscription tiers · {total} agents</p>
        </div>
        <button
          onClick={exportCSV}
          className="text-xs font-medium px-3 py-2 border border-sl-slate-200 rounded-lg
                     text-sl-slate-600 hover:border-sl-slate-300 bg-white transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setFilter(t.value); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              filter === t.value
                ? 'bg-sl-green-500 text-white border-sl-green-500'
                : 'bg-white text-sl-slate-600 border-sl-slate-200 hover:border-sl-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-sl-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sl-slate-100 text-xs text-sl-slate-400 uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Agent</th>
                <th className="px-4 py-3 text-left font-medium">Tier</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Listings</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Verified</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <React.Fragment key={a.agentId}>
                  <tr className="border-t border-sl-slate-50 hover:bg-sl-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sl-slate-900">{a.fullName}</p>
                      <p className="text-xs text-sl-slate-400">{a.agencyName ?? a.phone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${SUB_COLORS[a.subscriptionTier] ?? ''}`}>
                        {a.subscriptionTier}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-sl-slate-600">{a.listingCount}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {a.isVerifiedBadge
                        ? <span className="text-xs text-sl-green-600 font-medium">✓ Verified</span>
                        : <span className="text-xs text-sl-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-sl-slate-400">
                      {fmtDate(a.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setChangingId(changingId === a.agentId ? null : a.agentId)}
                        className="text-xs font-medium text-sl-green-600 hover:text-sl-green-700 transition-colors"
                      >
                        {changingId === a.agentId ? 'Close' : 'Change tier'}
                      </button>
                    </td>
                  </tr>
                  {changingId === a.agentId && (
                    <tr className="border-t border-sl-slate-50">
                      <td colSpan={6} className="px-4 pb-3">
                        <TierForm
                          agent={a}
                          onClose={() => setChangingId(null)}
                          onSaved={load}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {agents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-sl-slate-400">
                    No agents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {page > 1 && (
            <button onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-lg border border-sl-slate-200 text-sm text-sl-slate-600 hover:border-sl-slate-300">
              ←
            </button>
          )}
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-sl-green-500 text-white'
                  : 'border border-sl-slate-200 text-sl-slate-600 hover:border-sl-slate-300'
              }`}>
              {p}
            </button>
          ))}
          {page < totalPages && (
            <button onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-sl-slate-200 text-sm text-sl-slate-600 hover:border-sl-slate-300">
              →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
