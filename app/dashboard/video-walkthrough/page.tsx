'use client';

import { useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ListingWithVideo {
  id:    string;
  title: string;
  area:  string;
  city:  string;
  tier:  string;
  videoWalkthrough: {
    id:                string;
    cloudinaryPublicId: string;
    cloudinaryUrl:      string;
    status:            string;
    rejectionReason:   string | null;
  } | null;
}

/* ─── YouTube ID extractor ────────────────────────────────────────────────── */

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/* ─── Status badge ────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const c: Record<string, string> = {
    PENDING_REVIEW: 'bg-sl-gold-50 text-sl-gold-700 border border-sl-gold-200',
    APPROVED:       'bg-sl-green-50 text-sl-green-700 border border-sl-green-200',
    REJECTED:       'bg-red-50 text-red-700 border border-red-200',
  };
  const label: Record<string, string> = {
    PENDING_REVIEW: 'Pending review',
    APPROVED:       'Approved ✓',
    REJECTED:       'Rejected',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${c[status] ?? 'bg-sl-slate-100 text-sl-slate-500'}`}>
      {label[status] ?? status}
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function VideoWalkthroughPage() {
  const [listings, setListings] = useState<ListingWithVideo[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [openId,   setOpenId]   = useState<string | null>(null);
  const [url,      setUrl]      = useState('');
  const [busy,     setBusy]     = useState(false);
  const [err,      setErr]      = useState('');
  const [success,  setSuccess]  = useState('');

  async function load() {
    setLoading(true);
    const token   = localStorage.getItem('accessToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    const res     = await fetch('/api/listings?limit=50&myListings=1', { headers }).then((r) => r.json());
    if (res.success || res.data) {
      // Filter to agent's listings with video walkthrough info
      setListings(res.data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function submit(listingId: string) {
    const trimmed = url.trim();
    if (!trimmed) { setErr('Please enter a YouTube URL.'); return; }
    if (!extractYoutubeId(trimmed)) { setErr('Invalid YouTube URL. Please use a full YouTube link.'); return; }

    setBusy(true);
    setErr('');
    setSuccess('');
    const token   = localStorage.getItem('accessToken');
    const res = await fetch('/api/agent/video-walkthrough', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body:    JSON.stringify({ listingId, youtubeUrl: trimmed }),
    }).then((r) => r.json());
    setBusy(false);
    if (res.success) {
      setSuccess('Video submitted for review!');
      setOpenId(null);
      setUrl('');
      load();
    } else {
      setErr(typeof res.error === 'string' ? res.error : JSON.stringify(res.error));
    }
  }

  async function remove(listingId: string) {
    if (!confirm('Remove video walkthrough?')) return;
    const token = localStorage.getItem('accessToken');
    const res   = await fetch(`/api/agent/video-walkthrough?listingId=${listingId}`, {
      method:  'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).then((r) => r.json());
    if (res.success) load();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Agent Dashboard</p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Video Walkthroughs</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5 leading-relaxed">
          Upload your property tour to YouTube and paste the link here.
          Our team will review it within 24 hours. Once approved, it appears on your listing.
        </p>
      </div>

      {/* How it works */}
      <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-sl-slate-700 mb-3">How to add a video walkthrough</p>
        <ol className="space-y-2 text-xs text-sl-slate-600">
          <li className="flex gap-2"><span className="font-bold text-sl-green-600 flex-shrink-0">1.</span> Record a walkthrough of your property on your phone (2–5 minutes is ideal).</li>
          <li className="flex gap-2"><span className="font-bold text-sl-green-600 flex-shrink-0">2.</span> Upload it to YouTube (it can be &ldquo;Unlisted&rdquo; — it doesn&apos;t need to be public).</li>
          <li className="flex gap-2"><span className="font-bold text-sl-green-600 flex-shrink-0">3.</span> Copy the YouTube link and paste it below for the listing you want to add it to.</li>
          <li className="flex gap-2"><span className="font-bold text-sl-green-600 flex-shrink-0">4.</span> Our team reviews it within 24 hours. Once approved, renters can watch it directly on SureLeads.</li>
        </ol>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-sl-green-50 border border-sl-green-200 rounded-xl text-xs text-sl-green-700 font-medium">
          {success}
        </div>
      )}

      {/* Listings */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-sl-slate-200 rounded-2xl">
          <p className="text-sm font-semibold text-sl-slate-600 mb-1">No listings yet</p>
          <p className="text-xs text-sl-slate-400">Create a listing first, then come back to add a video walkthrough.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const vw = l.videoWalkthrough;
            return (
              <div key={l.id} className="bg-white border border-sl-slate-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sl-slate-900 truncate">{l.title}</p>
                    <p className="text-xs text-sl-slate-500">{l.area}, {l.city}</p>
                    {vw ? (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <StatusBadge status={vw.status} />
                        <a
                          href={vw.cloudinaryUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-sl-green-600 hover:underline"
                        >
                          View on YouTube ↗
                        </a>
                      </div>
                    ) : (
                      <p className="text-xs text-sl-slate-400 mt-1">No video walkthrough</p>
                    )}
                    {vw?.rejectionReason && (
                      <p className="text-xs text-red-600 mt-1">
                        Rejection note: {vw.rejectionReason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {vw ? (
                      <>
                        <button
                          onClick={() => { setOpenId(openId === l.id ? null : l.id); setUrl(vw.cloudinaryUrl); setErr(''); }}
                          className="text-xs text-sl-slate-500 hover:text-sl-slate-700 border border-sl-slate-200 px-2.5 py-1.5 rounded-lg"
                        >
                          {openId === l.id ? 'Cancel' : 'Replace'}
                        </button>
                        <button
                          onClick={() => remove(l.id)}
                          className="text-xs text-red-600 hover:text-red-700 border border-red-200 px-2.5 py-1.5 rounded-lg"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setOpenId(openId === l.id ? null : l.id); setUrl(''); setErr(''); }}
                        className="text-xs font-medium text-sl-green-700 bg-sl-green-50 border border-sl-green-200
                                   px-3 py-1.5 rounded-lg hover:bg-sl-green-100 transition-colors"
                      >
                        {openId === l.id ? 'Cancel' : '+ Add video'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit form */}
                {openId === l.id && (
                  <div className="mt-4 pt-4 border-t border-sl-slate-100 space-y-3">
                    <p className="text-xs font-semibold text-sl-slate-700">YouTube video URL</p>
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => { setUrl(e.target.value); setErr(''); }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full text-sm border border-sl-slate-200 rounded-lg px-3 py-2
                                 focus:outline-none focus:ring-2 focus:ring-sl-green-300"
                    />
                    {url && extractYoutubeId(url) && (
                      <div className="rounded-lg overflow-hidden border border-sl-slate-200 aspect-video">
                        <iframe
                          src={`https://www.youtube.com/embed/${extractYoutubeId(url)}?rel=0`}
                          className="w-full h-full"
                          title="Preview"
                          allow="accelerometer; autoplay"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {err && <p className="text-xs text-red-600">{err}</p>}
                    <button
                      onClick={() => submit(l.id)}
                      disabled={busy}
                      className="px-4 py-2 text-sm font-medium bg-sl-green-500 text-white rounded-lg
                                 hover:bg-sl-green-600 disabled:opacity-50 transition-colors"
                    >
                      {busy ? 'Submitting…' : 'Submit for review'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
