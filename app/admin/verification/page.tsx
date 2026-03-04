'use client';

import { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface PendingAgent {
  id:              string;
  userId:          string;
  fullName:        string;
  phone:           string;
  email:           string | null;
  agencyName:      string | null;
  cacNumber:       string | null;
  primaryCity:     string;
  credibilityTier: string;
  listingCount:    number;
  createdAt:       string;
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function VerificationPage() {
  const [agents,  setAgents]  = useState<PendingAgent[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [err,     setErr]     = useState('');
  const [infoId,  setInfoId]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    // Re-use the agents API with filter=unverified
    const res = await fetch('/api/admin/agents?filter=unverified&limit=100').then((r) => r.json());
    if (res.success) {
      // Only show agents who have submitted a CAC number (ready for review)
      const pending = res.data.filter((a: PendingAgent & { cacNumber: string | null }) => a.cacNumber);
      setAgents(pending);
      setTotal(pending.length);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function verify(agentId: string) {
    setVerifying(agentId);
    setErr('');
    const res = await fetch(`/api/admin/agents/${agentId}/approve-verification`, {
      method: 'POST',
    }).then((r) => r.json());
    setVerifying(null);
    if (res.success) load();
    else setErr(res.error ?? 'Failed to verify agent');
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Verification Queue</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">
          Agents who have submitted their CAC number and are awaiting verification.
          {!loading && ` · ${total} pending`}
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-6 p-4 bg-sl-gold-50 border border-sl-gold-200 rounded-xl flex gap-3">
        <svg className="w-4 h-4 text-sl-gold-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-sl-gold-700 leading-relaxed">
          Before verifying, confirm the CAC number matches the agent&apos;s registered business.
          Verified agents receive a ✓ badge on their listings and profile, improving trust with renters.
        </p>
      </div>

      {err && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{err}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 bg-sl-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-sl-slate-200 rounded-2xl">
          <div className="w-12 h-12 bg-sl-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-sl-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-sl-slate-700 mb-1">All clear</p>
          <p className="text-xs text-sl-slate-400">
            No agents are currently waiting for verification, or no agent has submitted a CAC number yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((a) => (
            <div key={a.id} className="bg-white border border-sl-slate-200 rounded-2xl p-5">

              {/* Agent info */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="font-semibold text-sl-slate-900">{a.fullName}</p>
                  {a.agencyName && (
                    <p className="text-xs text-sl-slate-500">{a.agencyName}</p>
                  )}
                </div>
                <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-sl-slate-100 text-sl-slate-500 border border-sl-slate-200 flex-shrink-0">
                  Unverified
                </span>
              </div>

              {/* Detail rows */}
              <dl className="space-y-1.5 mb-4">
                <div className="flex gap-2 text-xs">
                  <dt className="text-sl-slate-400 w-28 flex-shrink-0">Phone</dt>
                  <dd className="text-sl-slate-700">{a.phone}</dd>
                </div>
                {a.email && (
                  <div className="flex gap-2 text-xs">
                    <dt className="text-sl-slate-400 w-28 flex-shrink-0">Email</dt>
                    <dd className="text-sl-slate-700">{a.email}</dd>
                  </div>
                )}
                <div className="flex gap-2 text-xs">
                  <dt className="text-sl-slate-400 w-28 flex-shrink-0">City</dt>
                  <dd className="text-sl-slate-700">{a.primaryCity}</dd>
                </div>
                {a.cacNumber && (
                  <div className="flex gap-2 text-xs">
                    <dt className="text-sl-slate-400 w-28 flex-shrink-0">CAC Number</dt>
                    <dd className="font-mono text-sl-slate-900 font-semibold">{a.cacNumber}</dd>
                  </div>
                )}
                <div className="flex gap-2 text-xs">
                  <dt className="text-sl-slate-400 w-28 flex-shrink-0">Listings</dt>
                  <dd className="text-sl-slate-700">{a.listingCount}</dd>
                </div>
                <div className="flex gap-2 text-xs">
                  <dt className="text-sl-slate-400 w-28 flex-shrink-0">Joined</dt>
                  <dd className="text-sl-slate-700">
                    {new Date(a.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </dd>
                </div>
              </dl>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => verify(a.id)}
                  disabled={verifying === a.id}
                  className="flex-1 text-xs font-semibold px-3 py-2 bg-sl-green-500 text-white rounded-lg
                             hover:bg-sl-green-600 disabled:opacity-50 transition-colors text-center"
                >
                  {verifying === a.id ? 'Verifying…' : '✓ Verify agent'}
                </button>
                <button
                  onClick={() => setInfoId(infoId === a.id ? null : a.id)}
                  className="text-xs font-medium px-3 py-2 border border-sl-slate-200 rounded-lg
                             text-sl-slate-600 hover:border-sl-slate-300 transition-colors bg-white"
                >
                  {infoId === a.id ? 'Hide' : 'Request info'}
                </button>
              </div>

              {/* Request info panel */}
              {infoId === a.id && (
                <div className="mt-3 p-3 bg-sl-slate-50 border border-sl-slate-200 rounded-xl">
                  <p className="text-xs font-semibold text-sl-slate-700 mb-1">Contact agent to request documents</p>
                  <p className="text-xs text-sl-slate-500 leading-relaxed">
                    Reach out to <strong>{a.fullName}</strong> via phone{' '}
                    <a href={`tel:${a.phone}`} className="text-sl-green-600 font-medium">{a.phone}</a>
                    {a.email && (
                      <> or email <a href={`mailto:${a.email}`} className="text-sl-green-600 font-medium">{a.email}</a></>
                    )}.
                    Request a copy of their CAC certificate or other supporting documents.
                  </p>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
