'use client';

import React, { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AgentRow {
  id:               string;
  userId:           string;
  fullName:         string;
  phone:            string;
  agencyName:       string | null;
  primaryCity:      string;
  subscriptionTier: string;
  credibilityScore: number;
  credibilityTier:  string;
  scoreOverride:    number | null;
  isVerifiedBadge:  boolean;
  isSuspended:      boolean;
  suspendedAt:      string | null;
  listingCount:     number;
}

type Filter = 'all' | 'suspended' | 'unverified';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const TIER_COLORS: Record<string, string> = {
  PLATINUM: 'bg-purple-50 text-purple-700 border border-purple-200',
  GOLD:     'bg-sl-gold-50 text-sl-gold-700 border border-sl-gold-200',
  SILVER:   'bg-sl-slate-100 text-sl-slate-600 border border-sl-slate-200',
  BRONZE:   'bg-orange-50 text-orange-600 border border-orange-200',
  UNRATED:  'bg-sl-slate-50 text-sl-slate-400 border border-sl-slate-200',
};

const SUB_COLORS: Record<string, string> = {
  AGENCY:       'text-purple-700',
  PROFESSIONAL: 'text-sl-green-700',
  STARTER:      'text-sl-slate-400',
};

/* ─── Inline override form ───────────────────────────────────────────────── */

interface OverrideFormProps {
  agent:    AgentRow;
  onClose:  () => void;
  onSaved:  () => void;
}

function OverrideForm({ agent, onClose, onSaved }: OverrideFormProps) {
  const [score, setScore] = useState<string>(agent.scoreOverride?.toString() ?? '');
  const [note,  setNote]  = useState('');
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState('');

  async function submit(clear: boolean) {
    setBusy(true);
    setErr('');
    const body = clear
      ? { score: null }
      : { score: parseInt(score), note };
    if (!clear && (isNaN(parseInt(score)) || parseInt(score) < 0 || parseInt(score) > 1000)) {
      setErr('Score must be 0–1000');
      setBusy(false);
      return;
    }
    const res = await fetch(`/api/admin/agents/${agent.id}/override-credibility`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }).then((r) => r.json());
    setBusy(false);
    if (res.success) { onSaved(); onClose(); }
    else setErr(res.error ?? 'Failed');
  }

  return (
    <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-4 mt-2">
      <p className="text-xs font-semibold text-sl-slate-700 mb-3">Override credibility score</p>
      <div className="flex gap-2 mb-2">
        <input
          type="number"
          min={0}
          max={1000}
          placeholder="Score (0–1000)"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="w-32 text-sm px-3 py-1.5 border border-sl-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sl-green-400"
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 text-sm px-3 py-1.5 border border-sl-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sl-green-400"
        />
      </div>
      {err && <p className="text-xs text-red-600 mb-2">{err}</p>}
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => submit(false)}
          className="text-xs font-medium px-3 py-1.5 bg-sl-green-600 text-white rounded-lg hover:bg-sl-green-700 disabled:opacity-50"
        >
          Set override
        </button>
        {agent.scoreOverride !== null && (
          <button
            disabled={busy}
            onClick={() => submit(true)}
            className="text-xs font-medium px-3 py-1.5 border border-sl-slate-200 text-sl-slate-600 rounded-lg hover:bg-sl-slate-100 disabled:opacity-50"
          >
            Clear override
          </button>
        )}
        <button
          onClick={onClose}
          className="text-xs text-sl-slate-400 hover:text-sl-slate-600 px-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AdminAgentsPage() {
  const [filter,   setFilter]   = useState<Filter>('all');
  const [agents,   setAgents]   = useState<AgentRow[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [busy,        setBusy]        = useState<string | null>(null);
  const [override,    setOverride]    = useState<string | null>(null); // agentId with open override form
  // Inline suspend form state
  const [suspendTarget, setSuspendTarget] = useState<string | null>(null); // agentId
  const [suspendReason, setSuspendReason] = useState('');

  const limit = 25;

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/agents?filter=${filter}&page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) { setAgents(j.data); setTotal(j.total); }
      })
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const changeFilter = (f: Filter) => { setFilter(f); setPage(1); };

  /* ── Actions ── */
  async function submitSuspend(agentId: string) {
    if (!suspendReason.trim()) return;
    setBusy(agentId);
    await fetch(`/api/admin/agents/${agentId}/suspend`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason: suspendReason.trim() }),
    });
    setBusy(null);
    setSuspendTarget(null);
    setSuspendReason('');
    load();
  }

  async function reinstate(a: AgentRow) {
    setBusy(a.id);
    await fetch(`/api/admin/agents/${a.id}/reinstate`, { method: 'POST' });
    setBusy(null);
    load();
  }

  async function approveVerification(a: AgentRow) {
    setBusy(a.id);
    await fetch(`/api/admin/agents/${a.id}/approve-verification`, { method: 'POST' });
    setBusy(null);
    load();
  }

  const pages = Math.ceil(total / limit);

  const TABS: { label: string; value: Filter }[] = [
    { label: 'All Agents',  value: 'all'        },
    { label: 'Suspended',   value: 'suspended'  },
    { label: 'Unverified',  value: 'unverified' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
          Admin console
        </p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Agents</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">
          Manage agent accounts, credibility, and verification status
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sl-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => changeFilter(t.value)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              filter === t.value
                ? 'border-sl-green-500 text-sl-green-700'
                : 'border-transparent text-sl-slate-500 hover:text-sl-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-xs text-sl-slate-400 mb-4">
        {loading ? 'Loading…' : `${total} agent${total !== 1 ? 's' : ''}`}
      </p>

      {/* Table */}
      <div className="bg-white border border-sl-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sl-slate-50 border-b border-sl-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-4 py-3">Agent</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">City</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Credibility</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Plan</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Listings</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-sl-slate-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sl-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-sl-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : agents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-sl-slate-400 text-sm">
                    No agents match this filter
                  </td>
                </tr>
              ) : (
                agents.map((a) => {
                  const isBusy      = busy === a.id;
                  const showOverride = override === a.id;
                  const showSuspend  = suspendTarget === a.id;
                  return (
                    <React.Fragment key={a.id}>
                      <tr
                        className={`hover:bg-sl-slate-50 transition-colors ${a.isSuspended ? 'opacity-60' : ''}`}
                      >
                        {/* Agent */}
                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-medium text-sl-slate-900 truncate">{a.fullName}</p>
                          <p className="text-xs text-sl-slate-400 truncate">
                            {a.agencyName ?? 'Independent'} · {a.phone}
                          </p>
                          {a.scoreOverride !== null && (
                            <p className="text-2xs text-amber-600 font-medium">Override: {a.scoreOverride}</p>
                          )}
                        </td>

                        {/* City */}
                        <td className="px-3 py-3 text-sl-slate-600 whitespace-nowrap">{a.primaryCity}</td>

                        {/* Credibility */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-sl-slate-900">{a.credibilityScore}</span>
                            <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${TIER_COLORS[a.credibilityTier] ?? ''}`}>
                              {a.credibilityTier}
                            </span>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="px-3 py-3">
                          <span className={`text-xs font-medium ${SUB_COLORS[a.subscriptionTier] ?? ''}`}>
                            {a.subscriptionTier}
                          </span>
                        </td>

                        {/* Listings */}
                        <td className="px-3 py-3 text-sl-slate-600">{a.listingCount}</td>

                        {/* Status */}
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`w-fit text-2xs font-semibold px-2 py-0.5 rounded-full ${
                              a.isSuspended
                                ? 'bg-red-50 text-red-600 border border-red-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                            }`}>
                              {a.isSuspended ? 'Suspended' : 'Active'}
                            </span>
                            {a.isVerifiedBadge && (
                              <span className="w-fit text-2xs font-semibold px-2 py-0.5 rounded-full bg-sl-green-50 text-sl-green-700 border border-sl-green-200">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {!a.isVerifiedBadge && (
                              <button
                                disabled={isBusy}
                                onClick={() => approveVerification(a)}
                                className="text-xs font-medium px-2 py-1 rounded border border-sl-green-200 text-sl-green-700 hover:bg-sl-green-50 transition-colors disabled:opacity-50"
                              >
                                Verify
                              </button>
                            )}

                            <button
                              disabled={isBusy}
                              onClick={() => setOverride(showOverride ? null : a.id)}
                              className="text-xs font-medium px-2 py-1 rounded border border-sl-slate-200 text-sl-slate-600 hover:bg-sl-slate-50 transition-colors disabled:opacity-50"
                            >
                              Score
                            </button>

                            {a.isSuspended ? (
                              <button
                                disabled={isBusy}
                                onClick={() => reinstate(a)}
                                className="text-xs font-medium px-2 py-1 rounded border border-sl-green-200 text-sl-green-700 hover:bg-sl-green-50 transition-colors disabled:opacity-50"
                              >
                                Reinstate
                              </button>
                            ) : (
                              <button
                                disabled={isBusy}
                                onClick={() => {
                                  setSuspendTarget(showSuspend ? null : a.id);
                                  setSuspendReason('');
                                }}
                                className={`text-xs font-medium px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                                  showSuspend
                                    ? 'border-sl-slate-200 text-sl-slate-500 hover:bg-sl-slate-50'
                                    : 'border-red-200 text-red-600 hover:bg-red-50'
                                }`}
                              >
                                {showSuspend ? 'Cancel' : 'Suspend'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Inline override form */}
                      {showOverride && (
                        <tr>
                          <td colSpan={7} className="px-4 pb-3">
                            <OverrideForm
                              agent={a}
                              onClose={() => setOverride(null)}
                              onSaved={load}
                            />
                          </td>
                        </tr>
                      )}

                      {/* Inline suspend form */}
                      {showSuspend && (
                        <tr>
                          <td colSpan={7} className="px-4 pb-3">
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-1">
                              <p className="text-xs font-semibold text-red-700 mb-3">
                                Suspend {a.fullName}
                              </p>
                              <input
                                type="text"
                                placeholder="Reason for suspension (required)"
                                value={suspendReason}
                                onChange={(e) => setSuspendReason(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') submitSuspend(a.id); }}
                                className="w-full text-sm px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 mb-3 bg-white"
                              />
                              <div className="flex gap-2">
                                <button
                                  disabled={isBusy || !suspendReason.trim()}
                                  onClick={() => submitSuspend(a.id)}
                                  className="text-xs font-medium px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                                >
                                  {isBusy ? 'Suspending…' : 'Confirm suspend'}
                                </button>
                                <button
                                  onClick={() => { setSuspendTarget(null); setSuspendReason(''); }}
                                  className="text-xs text-sl-slate-400 hover:text-sl-slate-600 px-2 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-sl-slate-400">Page {page} of {pages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="text-xs px-3 py-1.5 border border-sl-slate-200 rounded-lg text-sl-slate-600
                         hover:border-sl-green-300 hover:text-sl-green-700 transition-colors disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs px-3 py-1.5 border border-sl-slate-200 rounded-lg text-sl-slate-600
                         hover:border-sl-green-300 hover:text-sl-green-700 transition-colors disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
