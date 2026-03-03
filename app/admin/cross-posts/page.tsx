'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ListingSide {
  id:          string;
  title:       string;
  area:        string;
  city:        string;
  rentPerYear: string;
  createdAt:   string;
  agent: {
    fullName:     string;
    agentProfile: { agencyName: string | null } | null;
  };
}

interface CrossPostFlag {
  id:              string;
  similarityScore: number;
  detectionMethod: string;
  status:          string;
  deadlineAt:      string;
  createdAt:       string;
  listingA:        ListingSide;
  listingB:        ListingSide;
}

type Action = 'CONFIRM' | 'DISMISSED' | 'BOTH_PAUSED';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmtRent(koboStr: string) {
  const naira = Math.round(Number(koboStr) / 100);
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000)     return `₦${(naira / 1_000).toFixed(0)}k`;
  return `₦${naira}`;
}

const METHOD_CHIP: Record<string, string> = {
  ADDRESS_MATCH: 'bg-sl-gold-50 text-sl-gold-700 border border-sl-gold-200',
  PHOTO_HASH:    'bg-red-50 text-red-600 border border-red-200',
  BOTH:          'bg-red-100 text-red-700 border border-red-300',
};

/** Returns 'A' if listingA was posted first (earlier createdAt), 'B' otherwise */
function getOriginal(a: ListingSide, b: ListingSide): 'A' | 'B' {
  return new Date(a.createdAt) <= new Date(b.createdAt) ? 'A' : 'B';
}

/* ─── Listing side card ──────────────────────────────────────────────────── */

function ListingCard({
  listing, label, role,
}: {
  listing: ListingSide;
  label:   'A' | 'B';
  role:    'original' | 'duplicate';
}) {
  const isOriginal = role === 'original';
  return (
    <div className={`flex-1 min-w-0 rounded-xl p-4 border ${
      isOriginal ? 'bg-sl-green-50 border-sl-green-200' : 'bg-sl-slate-50 border-sl-slate-200'
    }`}>
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-2xs font-bold bg-sl-slate-200 text-sl-slate-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
          {label}
        </span>
        <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${
          isOriginal
            ? 'bg-sl-green-100 text-sl-green-700 border border-sl-green-200'
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {isOriginal ? '✓ Original (first posted)' : '⚠ Duplicate (posted later)'}
        </span>
      </div>
      <p className="text-sm font-semibold text-sl-slate-900 truncate">{listing.title}</p>
      <p className="text-xs text-sl-slate-500 mt-0.5">{listing.area}, {listing.city}</p>
      <p className="text-xs text-sl-slate-500 mt-0.5">
        {listing.agent.fullName}
        {listing.agent.agentProfile?.agencyName && ` · ${listing.agent.agentProfile.agencyName}`}
      </p>
      <p className="text-sm font-bold text-sl-slate-900 mt-2">{fmtRent(listing.rentPerYear)} / yr</p>
      <p className="text-2xs text-sl-slate-400 mt-0.5">
        Posted {new Date(listing.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
      </p>
      <Link
        href={`/listings/${listing.id}`}
        target="_blank"
        className="text-2xs text-sl-green-600 hover:underline mt-1 inline-block"
      >
        View listing →
      </Link>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AdminCrossPostsPage() {
  const [flags,   setFlags]   = useState<CrossPostFlag[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy,    setBusy]    = useState<string | null>(null);

  const limit = 20;

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/cross-posts?status=OPEN&page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((j) => { if (j.success) { setFlags(j.data); setTotal(j.total); } })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function resolve(id: string, action: Action) {
    setBusy(id);
    const res = await fetch(`/api/admin/cross-posts/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action }),
    }).then((r) => r.json());
    setBusy(null);
    if (res.success) load();
  }

  const pages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
          Admin console
        </p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Cross-posts</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">
          Duplicate listing flags — earlier post is automatically the original
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl px-4 py-3 mb-6 flex gap-3 items-start">
        <span className="text-sl-slate-400 mt-0.5 flex-shrink-0">ℹ</span>
        <p className="text-xs text-sl-slate-600 leading-relaxed">
          <strong className="text-sl-slate-800">No agents are suspended for cross-posting.</strong>{' '}
          Confirming a cross-post clears the flag on the original (first-posted) listing and retains
          the duplicate label on the later one. Use <em>Hide both</em> only for confirmed fraud cases.
        </p>
      </div>

      <p className="text-xs text-sl-slate-400 mb-4">
        {loading ? 'Loading…' : `${total} open flag${total !== 1 ? 's' : ''}`}
      </p>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : flags.length === 0 ? (
        <div className="rounded-xl bg-sl-green-50 border border-sl-green-200 p-10 text-center">
          <svg className="w-10 h-10 text-sl-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-sl-green-700 text-sm">No open cross-post flags</p>
          <p className="text-xs text-sl-green-500 mt-1">All duplicate reports have been resolved.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {flags.map((flag) => {
            const isBusy       = busy === flag.id;
            const pctScore     = Math.round(flag.similarityScore * 100);
            const deadline     = new Date(flag.deadlineAt);
            const overdue      = deadline < new Date();
            const originalSide = getOriginal(flag.listingA, flag.listingB);
            const dupSide      = originalSide === 'A' ? 'B' : 'A';

            return (
              <div key={flag.id} className="bg-white border border-sl-slate-200 rounded-xl overflow-hidden">

                {/* Flag header */}
                <div className="px-5 py-4 border-b border-sl-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full border ${METHOD_CHIP[flag.detectionMethod] ?? 'bg-sl-slate-100 text-sl-slate-600 border-sl-slate-200'}`}>
                      {flag.detectionMethod.replace(/_/g, ' ')}
                    </span>
                    <span className="text-2xs font-semibold text-sl-slate-600">{pctScore}% similarity</span>
                    <span className={`text-2xs font-medium ${overdue ? 'text-red-500' : 'text-sl-slate-400'}`}>
                      {overdue
                        ? '⚠ Deadline passed'
                        : `Deadline: ${deadline.toLocaleDateString('en-NG', { dateStyle: 'medium' })}`}
                    </span>
                  </div>
                  <span className="text-2xs text-sl-slate-300">
                    Flagged {new Date(flag.createdAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </span>
                </div>

                {/* Side-by-side cards */}
                <div className="px-5 py-4 flex gap-4 flex-col sm:flex-row">
                  <ListingCard listing={flag.listingA} label="A" role={originalSide === 'A' ? 'original' : 'duplicate'} />
                  <div className="flex items-center justify-center sm:flex-col gap-1 flex-row text-sl-slate-300">
                    <div className="flex-1 w-px sm:w-full sm:h-px bg-sl-slate-200" />
                    <span className="text-xs font-bold px-1">VS</span>
                    <div className="flex-1 w-px sm:w-full sm:h-px bg-sl-slate-200" />
                  </div>
                  <ListingCard listing={flag.listingB} label="B" role={originalSide === 'B' ? 'original' : 'duplicate'} />
                </div>

                {/* Actions */}
                <div className="px-5 py-4 border-t border-sl-slate-100 flex flex-wrap gap-2 items-center">
                  <button
                    disabled={isBusy}
                    onClick={() => resolve(flag.id, 'CONFIRM')}
                    className="text-xs font-medium px-3 py-1.5 rounded bg-sl-green-600 text-white
                               hover:bg-sl-green-700 disabled:opacity-50 transition-colors"
                  >
                    ✓ Confirm cross-post
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => resolve(flag.id, 'DISMISSED')}
                    className="text-xs font-medium px-3 py-1.5 rounded border border-sl-slate-200
                               text-sl-slate-600 hover:bg-sl-slate-50 disabled:opacity-50 transition-colors"
                  >
                    Dismiss (false positive)
                  </button>
                  <button
                    disabled={isBusy}
                    onClick={() => resolve(flag.id, 'BOTH_PAUSED')}
                    className="text-xs font-medium px-3 py-1.5 rounded border border-red-200
                               text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    Hide both (fraud only)
                  </button>
                  {isBusy && <span className="text-xs text-sl-slate-400">Saving…</span>}
                </div>

                {/* Confirm note */}
                <div className="px-5 pb-3">
                  <p className="text-2xs text-sl-slate-400">
                    <strong>Confirm</strong> will mark Listing {originalSide} as the original and
                    Listing {dupSide} as the duplicate — neither listing is hidden and neither agent is suspended.
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
