'use client';

import { useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Walkthrough {
  id:           string;
  cloudinaryUrl: string;
  status:       string;
  uploadedAt:   string;
  listing: {
    id:    string;
    title: string;
    area:  string;
    city:  string;
    agent: { fullName: string };
  };
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function VideoWalkthroughsPage() {
  const [items,      setItems]      = useState<Walkthrough[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  // Inline reject reason (per card)
  const [rejectId,   setRejectId]   = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  useEffect(() => {
    fetch('/api/admin/video-walkthroughs?status=PENDING_REVIEW')
      .then((r) => r.json())
      .then((j) => { if (j.success) setItems(j.data); })
      .finally(() => setLoading(false));
  }, []);

  async function doAction(id: string, act: 'APPROVE' | 'REJECT', reason?: string) {
    setProcessing(id);
    await fetch(`/api/admin/video-walkthroughs/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: act, reason }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setRejectId(null);
    setRejectNote('');
    setProcessing(null);
  }

  const openReject = (id: string) => { setRejectId(id); setRejectNote(''); };
  const cancelReject = () => { setRejectId(null); setRejectNote(''); };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
          Admin console
        </p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Video Reviews</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">
          Approve or reject listing video walkthroughs
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-sl-green-50 border border-sl-green-200 p-10 text-center">
          <svg className="w-10 h-10 text-sl-green-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-semibold text-sl-green-700 text-sm">All caught up!</p>
          <p className="text-xs text-sl-green-500 mt-1">No pending video walkthroughs to review.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item) => {
            const isPending  = processing === item.id;
            const showReject = rejectId === item.id;
            return (
              <div key={item.id} className="bg-white border border-sl-slate-200 rounded-xl overflow-hidden">

                {/* Listing info */}
                <div className="px-5 py-4 border-b border-sl-slate-100">
                  <p className="font-semibold text-sl-slate-900">{item.listing.title}</p>
                  <p className="text-xs text-sl-slate-400 mt-0.5">
                    {item.listing.area}, {item.listing.city}&nbsp;·&nbsp;{item.listing.agent.fullName}
                  </p>
                  <p className="text-2xs text-sl-slate-300 mt-0.5">
                    Uploaded {new Date(item.uploadedAt).toLocaleDateString('en-NG', { dateStyle: 'medium' })}
                  </p>
                </div>

                {/* Video */}
                <video controls className="w-full max-h-80 bg-sl-slate-900" src={item.cloudinaryUrl}>
                  Your browser does not support video playback.
                </video>

                {/* Actions */}
                <div className="px-5 py-4 flex flex-col gap-3">
                  {!showReject ? (
                    <div className="flex gap-3">
                      <button
                        disabled={isPending}
                        onClick={() => doAction(item.id, 'APPROVE')}
                        className="flex-1 rounded-lg bg-sl-green-600 text-white text-sm font-medium py-2.5
                                   hover:bg-sl-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isPending ? 'Processing…' : '✓ Approve'}
                      </button>
                      <button
                        disabled={isPending}
                        onClick={() => openReject(item.id)}
                        className="flex-1 rounded-lg border border-red-200 text-red-600 text-sm font-medium py-2.5
                                   hover:bg-red-50 disabled:opacity-50 transition-colors"
                      >
                        ✕ Reject
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-sl-slate-600">
                        Rejection reason <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="e.g. Video is too dark, listing not clearly visible"
                        className="w-full text-sm px-3 py-2 border border-sl-slate-300 rounded-lg
                                   focus:outline-none focus:ring-2 focus:ring-sl-green-400 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          disabled={isPending || !rejectNote.trim()}
                          onClick={() => doAction(item.id, 'REJECT', rejectNote.trim())}
                          className="text-sm font-medium px-4 py-2 bg-red-600 text-white rounded-lg
                                     hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isPending ? 'Rejecting…' : 'Confirm reject'}
                        </button>
                        <button
                          onClick={cancelReject}
                          className="text-sm px-4 py-2 text-sl-slate-500 hover:text-sl-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
