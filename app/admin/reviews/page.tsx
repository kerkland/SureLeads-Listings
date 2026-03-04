'use client';

import React, { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ReviewRow {
  id:            string;
  rating:        number;
  body:          string | null;
  isFlagged:     boolean;
  flaggedReason: string | null;
  flaggedAt:     string | null;
  createdAt:     string;
  reviewerName:  string;
  reviewerPhone: string;
  agentName:     string;
  agencyName:    string | null;
  listingTitle:  string;
  listingArea:   string;
}

type ReviewFilter = 'all' | 'flagged';

/* ─── Star rating ─────────────────────────────────────────────────────────── */

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-sm" title={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-sl-gold-500' : 'text-sl-slate-200'}>★</span>
      ))}
    </span>
  );
}

/* ─── Inline flag form ────────────────────────────────────────────────────── */

function FlagForm({ review, onClose, onSaved }: { review: ReviewRow; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState('');
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState('');

  async function submit(action: 'FLAG' | 'UNFLAG' | 'DISMISS') {
    if (action === 'FLAG' && !reason.trim()) { setErr('Please enter a reason.'); return; }
    setBusy(true);
    setErr('');
    const res = await fetch(`/api/admin/reviews/${review.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(action === 'FLAG' ? { action, reason } : { action }),
    }).then((r) => r.json());
    setBusy(false);
    if (res.success) { onSaved(); onClose(); }
    else setErr(typeof res.error === 'string' ? res.error : 'Failed');
  }

  if (review.isFlagged) {
    return (
      <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-4 mt-2 space-y-3">
        <p className="text-xs text-sl-slate-600">
          Currently flagged: <span className="text-red-600">{review.flaggedReason}</span>
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => submit('UNFLAG')}
            disabled={busy}
            className="text-xs px-3 py-1.5 bg-sl-green-50 text-sl-green-700 border border-sl-green-200
                       rounded-lg hover:bg-sl-green-100 disabled:opacity-50 transition-colors"
          >
            {busy ? '…' : 'Unflag review'}
          </button>
          <button
            onClick={() => submit('DISMISS')}
            disabled={busy}
            className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200
                       rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
          >
            {busy ? '…' : 'Dismiss (delete)'}
          </button>
          <button onClick={onClose} className="text-xs text-sl-slate-400 hover:text-sl-slate-600">Cancel</button>
        </div>
        {err && <p className="text-xs text-red-600">{err}</p>}
      </div>
    );
  }

  return (
    <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-4 mt-2 space-y-3">
      <p className="text-xs font-semibold text-sl-slate-700">Flag or dismiss this review</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for flagging…"
        rows={2}
        className="w-full text-xs border border-sl-slate-200 rounded-lg px-3 py-2 bg-white resize-none"
      />
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => submit('FLAG')}
          disabled={busy}
          className="text-xs px-3 py-1.5 bg-sl-gold-50 text-sl-gold-700 border border-sl-gold-200
                     rounded-lg hover:bg-sl-gold-100 disabled:opacity-50 transition-colors"
        >
          {busy ? '…' : 'Flag review'}
        </button>
        <button
          onClick={() => submit('DISMISS')}
          disabled={busy}
          className="text-xs px-3 py-1.5 bg-red-50 text-red-700 border border-red-200
                     rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
        >
          {busy ? '…' : 'Dismiss (delete)'}
        </button>
        <button onClick={onClose} className="text-xs text-sl-slate-400 hover:text-sl-slate-600">Cancel</button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function ReviewsPage() {
  const [reviews,     setReviews]     = useState<ReviewRow[]>([]);
  const [total,       setTotal]       = useState(0);
  const [flaggedTotal, setFlaggedTotal] = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [filter,      setFilter]      = useState<ReviewFilter>('all');
  const [loading,     setLoading]     = useState(true);
  const [actionId,    setActionId]    = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const qs  = new URLSearchParams({ filter, page: String(page), limit: '25' });
    const res = await fetch(`/api/admin/reviews?${qs}`).then((r) => r.json());
    if (res.success) {
      setReviews(res.data);
      setTotal(res.total);
      setFlaggedTotal(res.flaggedTotal ?? 0);
      setTotalPages(res.totalPages ?? 1);
    }
    setLoading(false);
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const TABS: { key: ReviewFilter; label: string }[] = [
    { key: 'all',     label: `All reviews (${total})` },
    { key: 'flagged', label: `Flagged (${flaggedTotal})` },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Reviews Moderation</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">Flag suspicious or abusive reviews and dismiss fraudulent ones.</p>
      </div>

      {/* Filter tabs */}
      <div className="flex border-b border-sl-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setFilter(t.key); setPage(1); }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              filter === t.key
                ? 'border-sl-green-500 text-sl-green-600'
                : 'border-transparent text-sl-slate-500 hover:text-sl-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-sl-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-sl-slate-600 mb-1">
            {filter === 'flagged' ? 'No flagged reviews' : 'No reviews yet'}
          </p>
          <p className="text-xs text-sl-slate-400">
            {filter === 'flagged' ? 'All clear — no reviews have been flagged.' : 'Reviews will appear here once clients submit them.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className={`bg-white border rounded-xl p-4 ${r.isFlagged ? 'border-red-200' : 'border-sl-slate-200'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Stars rating={r.rating} />
                    {r.isFlagged && (
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                        Flagged
                      </span>
                    )}
                    <span className="text-xs text-sl-slate-400">
                      {new Date(r.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </span>
                  </div>
                  {r.body && (
                    <p className="text-sm text-sl-slate-700 leading-relaxed mb-2 line-clamp-2">
                      &ldquo;{r.body}&rdquo;
                    </p>
                  )}
                  <div className="text-xs text-sl-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>By <strong className="text-sl-slate-700">{r.reviewerName}</strong></span>
                    <span>→ Agent: <strong className="text-sl-slate-700">{r.agentName}</strong>{r.agencyName ? ` (${r.agencyName})` : ''}</span>
                    <span>· Listing: {r.listingTitle}, {r.listingArea}</span>
                  </div>
                  {r.isFlagged && r.flaggedReason && (
                    <p className="text-xs text-red-600 mt-1">Flag reason: {r.flaggedReason}</p>
                  )}
                </div>
                <button
                  onClick={() => setActionId(actionId === r.id ? null : r.id)}
                  className="text-xs font-medium text-sl-slate-500 hover:text-sl-slate-700 flex-shrink-0 transition-colors"
                >
                  {actionId === r.id ? 'Close' : 'Actions'}
                </button>
              </div>
              {actionId === r.id && (
                <FlagForm review={r} onClose={() => setActionId(null)} onSaved={load} />
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
