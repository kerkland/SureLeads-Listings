'use client';

import { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ListingRow {
  id:                        string;
  title:                     string;
  area:                      string;
  city:                      string;
  propertyType:              string;
  status:                    string;
  tier:                      string;
  nextReconfirmationDue:     string | null;
  graceExpiresAt:            string | null;
  hiddenAt:                  string | null;
  reconfirmationMissedCount: number;
  agentName:                 string;
  agentPhone:                string;
}

type Tab = 'due-soon' | 'grace' | 'hidden';

/* ─── Inline action form ──────────────────────────────────────────────────── */

function ActionForm({
  listing, tab, onClose, onSaved,
}: {
  listing: ListingRow; tab: Tab; onClose: () => void; onSaved: () => void;
}) {
  const [days, setDays] = useState('7');
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');

  async function submit(action: 'extend' | 'reinstate') {
    setBusy(true);
    setErr('');
    const body = action === 'extend' ? { action, days: parseInt(days) } : { action };
    const res  = await fetch(`/api/admin/reconfirmations/${listing.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }).then((r) => r.json());
    setBusy(false);
    if (res.success) { onSaved(); onClose(); }
    else setErr(typeof res.error === 'string' ? res.error : 'Failed');
  }

  return (
    <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-4 mt-2">
      {tab === 'due-soon' ? (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs font-semibold text-sl-slate-700">Extend deadline by:</p>
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="text-xs border border-sl-slate-200 rounded-lg px-2.5 py-1.5 bg-white"
          >
            {[1, 2, 3, 5, 7, 14].map((d) => (
              <option key={d} value={d}>{d} day{d !== 1 ? 's' : ''}</option>
            ))}
          </select>
          <button
            onClick={() => submit('extend')}
            disabled={busy}
            className="text-xs px-3 py-1.5 bg-sl-green-500 text-white rounded-lg hover:bg-sl-green-600 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Saving…' : 'Extend deadline'}
          </button>
          <button onClick={onClose} className="text-xs text-sl-slate-400 hover:text-sl-slate-600">Cancel</button>
        </div>
      ) : (
        <div className="flex items-center gap-3 flex-wrap">
          <p className="text-xs text-sl-slate-700">
            Reinstate <strong>{listing.title}</strong> and restore to AVAILABLE?
          </p>
          <button
            onClick={() => submit('reinstate')}
            disabled={busy}
            className="text-xs px-3 py-1.5 bg-sl-green-500 text-white rounded-lg hover:bg-sl-green-600 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Saving…' : 'Reinstate listing'}
          </button>
          <button onClick={onClose} className="text-xs text-sl-slate-400 hover:text-sl-slate-600">Cancel</button>
        </div>
      )}
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function ReconfirmationsPage() {
  const [tab,       setTab]       = useState<Tab>('due-soon');
  const [listings,  setListings]  = useState<ListingRow[]>([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [tabCounts, setTabCounts] = useState({ dueSoon: 0, grace: 0, hidden: 0 });
  const [loading,   setLoading]   = useState(true);
  const [actionId,  setActionId]  = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs  = new URLSearchParams({ tab, page: String(page), limit: '25' });
    const res = await fetch(`/api/admin/reconfirmations?${qs}`).then((r) => r.json());
    if (res.success) {
      setListings(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages ?? 1);
      if (res.tabCounts) setTabCounts(res.tabCounts);
    }
    setLoading(false);
  }, [tab, page]);

  useEffect(() => { load(); }, [load]);

  const TABS: { key: Tab; label: string; count: number; color: string }[] = [
    { key: 'due-soon', label: 'Due Soon',       count: tabCounts.dueSoon, color: 'text-sl-gold-700' },
    { key: 'grace',    label: 'In Grace Period', count: tabCounts.grace,   color: 'text-orange-600'  },
    { key: 'hidden',   label: 'Recently Hidden', count: tabCounts.hidden,  color: 'text-red-600'     },
  ];

  const STATUS_COLORS: Record<string, string> = {
    AVAILABLE:              'bg-sl-green-50 text-sl-green-700',
    PENDING_RECONFIRMATION: 'bg-sl-gold-50 text-sl-gold-700',
    HIDDEN:                 'bg-red-50 text-red-700',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Reconfirmation Oversight</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">
          Monitor VERIFIED listings approaching or past their reconfirmation deadline.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-sl-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); setActionId(null); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? 'border-sl-green-500 text-sl-green-600'
                : 'border-transparent text-sl-slate-500 hover:text-sl-slate-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 text-xs font-bold ${t.color}`}>({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-sl-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-sl-slate-600 mb-1">All clear</p>
          <p className="text-xs text-sl-slate-400">No listings in this category right now.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-white border border-sl-slate-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-sl-slate-900 truncate">{l.title}</p>
                    <span className={`inline-block text-2xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[l.status] ?? 'bg-sl-slate-100 text-sl-slate-600'}`}>
                      {l.status.replace(/_/g, ' ')}
                    </span>
                    {l.reconfirmationMissedCount > 0 && (
                      <span className="text-2xs text-red-500 font-medium">
                        {l.reconfirmationMissedCount}× missed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-sl-slate-500">{l.area}, {l.city} · {l.propertyType}</p>
                  <p className="text-xs text-sl-slate-400 mt-0.5">
                    Agent: <span className="text-sl-slate-600">{l.agentName}</span> · {l.agentPhone}
                  </p>
                  {tab === 'due-soon' && l.nextReconfirmationDue && (
                    <p className="text-xs text-sl-gold-600 font-medium mt-1">
                      Due: {l.nextReconfirmationDue}
                    </p>
                  )}
                  {tab === 'grace' && l.graceExpiresAt && (
                    <p className="text-xs text-orange-600 font-medium mt-1">
                      Grace expires: {l.graceExpiresAt}
                    </p>
                  )}
                  {tab === 'hidden' && l.hiddenAt && (
                    <p className="text-xs text-red-500 font-medium mt-1">
                      Hidden: {l.hiddenAt}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {tab === 'due-soon' && (
                    <button
                      onClick={() => setActionId(actionId === l.id ? null : l.id)}
                      className="text-xs px-3 py-1.5 bg-sl-gold-50 text-sl-gold-700 border border-sl-gold-200
                                 rounded-lg hover:bg-sl-gold-100 transition-colors font-medium"
                    >
                      Extend deadline
                    </button>
                  )}
                  {(tab === 'grace' || tab === 'hidden') && (
                    <button
                      onClick={() => setActionId(actionId === l.id ? null : l.id)}
                      className="text-xs px-3 py-1.5 bg-sl-green-50 text-sl-green-700 border border-sl-green-200
                                 rounded-lg hover:bg-sl-green-100 transition-colors font-medium"
                    >
                      Reinstate
                    </button>
                  )}
                </div>
              </div>
              {actionId === l.id && (
                <ActionForm
                  listing={l}
                  tab={tab}
                  onClose={() => setActionId(null)}
                  onSaved={load}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {page > 1 && (
            <button onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-lg border border-sl-slate-200 text-sm text-sl-slate-600">←</button>
          )}
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${
                p === page ? 'bg-sl-green-500 text-white' : 'border border-sl-slate-200 text-sl-slate-600'
              }`}>{p}</button>
          ))}
          {page < totalPages && (
            <button onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-sl-slate-200 text-sm text-sl-slate-600">→</button>
          )}
        </div>
      )}
    </div>
  );
}
