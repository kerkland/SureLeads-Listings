'use client';

import { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ComplaintRow {
  id:          string;
  category:    string;
  description: string;
  status:      string;
  resolution:  string | null;
  resolvedAt:  string | null;
  createdAt:   string;
  complainant: { fullName: string; phone: string };
  agent:       { agencyName: string | null; primaryCity: string; user: { fullName: string } };
  listing:     { title: string } | null;
}

type StatusFilter = 'all' | 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const STATUS_CHIP: Record<string, string> = {
  OPEN:          'bg-red-50 text-red-600 border border-red-200',
  UNDER_REVIEW:  'bg-sl-gold-50 text-sl-gold-700 border border-sl-gold-200',
  RESOLVED:      'bg-sl-green-50 text-sl-green-700 border border-sl-green-200',
  DISMISSED:     'bg-sl-slate-100 text-sl-slate-500 border border-sl-slate-200',
};

const CATEGORY_LABEL: Record<string, string> = {
  NO_SHOW:         'No-show',
  MISREPRESENTATION: 'Misrepresentation',
  FRAUD:           'Fraud',
};

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AdminComplaintsPage() {
  const [filter,     setFilter]     = useState<StatusFilter>('all');
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState<string | null>(null);
  const [busy,       setBusy]       = useState<string | null>(null);

  // Resolution form state
  const [resolving, setResolving] = useState<{ id: string; action: 'RESOLVE' | 'DISMISS' } | null>(null);
  const [resNote,   setResNote]   = useState('');

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    const statusParam = filter !== 'all' ? `&status=${filter}` : '';
    fetch(`/api/admin/complaints?page=${page}&limit=${limit}${statusParam}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) { setComplaints(j.data); setTotal(j.total); }
      })
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const changeFilter = (f: StatusFilter) => { setFilter(f); setPage(1); };

  /* ── Actions ── */
  async function moveToUnderReview(id: string) {
    setBusy(id);
    // Direct PATCH — the complaints API only supports RESOLVE/DISMISS,
    // so we do a lightweight fetch to update status via Prisma server action pattern.
    // Using the same endpoint with a custom action key handled server-side.
    await fetch(`/api/admin/complaints/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'UNDER_REVIEW' }),
    });
    setBusy(null);
    load();
  }

  async function submitResolution() {
    if (!resolving) return;
    setBusy(resolving.id);
    await fetch(`/api/admin/complaints/${resolving.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: resolving.action, resolution: resNote || undefined }),
    });
    setBusy(null);
    setResolving(null);
    setResNote('');
    setExpanded(null);
    load();
  }

  const pages = Math.ceil(total / limit);

  const TABS: { label: string; value: StatusFilter }[] = [
    { label: 'All',          value: 'all'          },
    { label: 'Open',         value: 'OPEN'         },
    { label: 'Under Review', value: 'UNDER_REVIEW' },
    { label: 'Resolved',     value: 'RESOLVED'     },
    { label: 'Dismissed',    value: 'DISMISSED'    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
          Admin console
        </p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Complaints</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">
          Client complaints against agents — resolve or dismiss within 48 hours
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sl-slate-200 mb-6 overflow-x-auto">
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
        {loading ? 'Loading…' : `${total} complaint${total !== 1 ? 's' : ''}`}
      </p>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        <div className="rounded-xl bg-sl-green-50 border border-sl-green-200 p-10 text-center">
          <p className="font-semibold text-sl-green-700 text-sm">No complaints in this view</p>
          <p className="text-xs text-sl-green-500 mt-1">All clear for this filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => {
            const isExpanded  = expanded === c.id;
            const isResolving = resolving?.id === c.id;
            const isBusy      = busy === c.id;
            const canAct      = c.status === 'OPEN' || c.status === 'UNDER_REVIEW';

            return (
              <div
                key={c.id}
                className="bg-white border border-sl-slate-200 rounded-xl overflow-hidden"
              >
                {/* Row summary */}
                <button
                  className="w-full text-left px-5 py-4 hover:bg-sl-slate-50 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : c.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${STATUS_CHIP[c.status] ?? ''}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-sl-slate-100 text-sl-slate-600">
                          {CATEGORY_LABEL[c.category] ?? c.category}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-sl-slate-900 mt-1">
                        {c.complainant.fullName} vs {c.agent.user.fullName}
                        {c.agent.agencyName && ` (${c.agent.agencyName})`}
                      </p>
                      {c.listing && (
                        <p className="text-xs text-sl-slate-400 mt-0.5 truncate">
                          Re: {c.listing.title}
                        </p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <p className="text-xs text-sl-slate-400">
                        {new Date(c.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                      </p>
                      <p className="text-xs text-sl-slate-300 mt-0.5">
                        {isExpanded ? '▲ Collapse' : '▼ Expand'}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-sl-slate-100 px-5 py-4 space-y-4">

                    {/* Description */}
                    <div>
                      <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-wide mb-1">
                        Description
                      </p>
                      <p className="text-sm text-sl-slate-700 whitespace-pre-wrap">{c.description}</p>
                    </div>

                    {/* Resolution (if closed) */}
                    {c.resolution && (
                      <div>
                        <p className="text-xs font-semibold text-sl-slate-500 uppercase tracking-wide mb-1">
                          Resolution note
                        </p>
                        <p className="text-sm text-sl-slate-600">{c.resolution}</p>
                      </div>
                    )}

                    {/* Action buttons for open/under-review complaints */}
                    {canAct && !isResolving && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {c.status === 'OPEN' && (
                          <button
                            disabled={isBusy}
                            onClick={() => moveToUnderReview(c.id)}
                            className="text-xs font-medium px-3 py-1.5 rounded border border-sl-gold-200
                                       text-sl-gold-700 hover:bg-sl-gold-50 disabled:opacity-50 transition-colors"
                          >
                            Mark Under Review
                          </button>
                        )}
                        <button
                          disabled={isBusy}
                          onClick={() => { setResolving({ id: c.id, action: 'RESOLVE' }); setResNote(''); }}
                          className="text-xs font-medium px-3 py-1.5 rounded border border-sl-green-200
                                     text-sl-green-700 hover:bg-sl-green-50 disabled:opacity-50 transition-colors"
                        >
                          Resolve
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => { setResolving({ id: c.id, action: 'DISMISS' }); setResNote(''); }}
                          className="text-xs font-medium px-3 py-1.5 rounded border border-sl-slate-200
                                     text-sl-slate-600 hover:bg-sl-slate-50 disabled:opacity-50 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}

                    {/* Inline resolution form */}
                    {isResolving && resolving && (
                      <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-4">
                        <p className="text-xs font-semibold text-sl-slate-700 mb-2">
                          {resolving.action === 'RESOLVE' ? 'Resolve complaint' : 'Dismiss complaint'}
                        </p>
                        <textarea
                          rows={2}
                          value={resNote}
                          onChange={(e) => setResNote(e.target.value)}
                          placeholder="Resolution note (optional)"
                          className="w-full text-sm px-3 py-2 border border-sl-slate-300 rounded-lg mb-2
                                     focus:outline-none focus:ring-2 focus:ring-sl-green-400 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            disabled={isBusy}
                            onClick={submitResolution}
                            className={`text-xs font-medium px-3 py-1.5 rounded text-white disabled:opacity-50 transition-colors ${
                              resolving.action === 'RESOLVE'
                                ? 'bg-sl-green-600 hover:bg-sl-green-700'
                                : 'bg-sl-slate-600 hover:bg-sl-slate-700'
                            }`}
                          >
                            {isBusy ? 'Saving…' : resolving.action === 'RESOLVE' ? 'Confirm resolve' : 'Confirm dismiss'}
                          </button>
                          <button
                            onClick={() => setResolving(null)}
                            className="text-xs text-sl-slate-400 hover:text-sl-slate-600 px-2"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-6">
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
