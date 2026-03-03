'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Stats {
  totalListings:    number;
  verifiedListings: number;
  basicListings:    number;
  pendingVideos:    number;
  openComplaints:   number;
  suspendedAgents:  number;
  hiddenListings:   number;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function StatTile({ value, label, sub }: { value: number | string; label: string; sub?: string }) {
  return (
    <div className="bg-white border border-sl-slate-200 rounded-xl p-5">
      <p className="text-2xl font-bold text-sl-slate-900">{value}</p>
      <p className="text-xs font-medium text-sl-slate-700 mt-0.5">{label}</p>
      {sub && <p className="text-2xs text-sl-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

interface RedFlagProps {
  count:    number;
  label:    string;
  desc:     string;
  href:     string;
  severity: 'high' | 'medium' | 'low';
}

function RedFlagCard({ count, label, desc, href, severity }: RedFlagProps) {
  const colors = {
    high:   'border-red-200 bg-red-50',
    medium: 'border-sl-gold-200 bg-sl-gold-50',
    low:    'border-sl-slate-200 bg-sl-slate-50',
  };
  const dot = {
    high:   'bg-red-500',
    medium: 'bg-sl-gold-500',
    low:    'bg-sl-slate-400',
  };
  return (
    <div className={`border rounded-xl p-5 ${colors[severity]}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dot[severity]}`} />
          <p className="text-sm font-semibold text-sl-slate-900">{label}</p>
        </div>
        <span className="text-xl font-bold text-sl-slate-900">{count}</span>
      </div>
      <p className="text-xs text-sl-slate-500 mb-3 pl-4">{desc}</p>
      <Link
        href={href}
        className="text-xs font-medium text-sl-green-600 hover:text-sl-green-700 hover:underline pl-4"
      >
        Review →
      </Link>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AdminDashboardPage() {
  const [stats,        setStats]        = useState<Stats | null>(null);
  const [crossPosts,   setCrossPosts]   = useState(0);
  const [suspicious,   setSuspicious]   = useState(0);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/dashboard/stats').then((r) => r.json()),
      fetch('/api/admin/cross-posts?limit=1').then((r) => r.json()),
      fetch('/api/admin/listings?filter=suspicious&limit=1').then((r) => r.json()),
    ]).then(([s, cp, susp]) => {
      if (s.success)   setStats(s.data);
      if (cp.success)  setCrossPosts(cp.total ?? 0);
      if (susp.success) setSuspicious(susp.total ?? 0);
    }).finally(() => setLoading(false));
  }, []);

  const s = stats;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
          Admin console
        </p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Overview</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">
          SureLeads Listings · Operations dashboard
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* ── Stat tiles ── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <StatTile value={s?.totalListings ?? 0}    label="Total listings" />
            <StatTile value={s?.verifiedListings ?? 0} label="Verified" sub="VERIFIED tier" />
            <StatTile value={s?.basicListings ?? 0}    label="Basic" sub="BASIC tier" />
            <StatTile value={s?.hiddenListings ?? 0}   label="Hidden" sub="Missed reconfirmation" />
            <StatTile value={s?.pendingVideos ?? 0}    label="Pending videos" />
            <StatTile value={s?.openComplaints ?? 0}   label="Open complaints" />
            <StatTile value={suspendedAgents(s)}       label="Suspended agents" />
            <StatTile value={crossPosts}               label="Open cross-posts" />
          </div>

          {/* ── Red flag cards ── */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-sl-slate-900 mb-3">
              Red flags requiring attention
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RedFlagCard
                count={s?.pendingVideos ?? 0}
                label="Pending video reviews"
                desc="Video walkthroughs awaiting admin approval before listings go Verified."
                href="/admin/video-walkthroughs"
                severity={pending(s?.pendingVideos) > 5 ? 'high' : 'medium'}
              />
              <RedFlagCard
                count={s?.openComplaints ?? 0}
                label="Open complaints"
                desc="Client complaints against agents — resolve or dismiss within 48 hours."
                href="/admin/complaints"
                severity={pending(s?.openComplaints) > 3 ? 'high' : 'medium'}
              />
              <RedFlagCard
                count={crossPosts}
                label="Duplicate listings"
                desc="Cross-posting flags detected by photo hash or address matching."
                href="/admin/cross-posts"
                severity={crossPosts > 0 ? 'medium' : 'low'}
              />
              <RedFlagCard
                count={suspicious}
                label="Suspicious prices"
                desc="Listings priced far outside area median — possible data errors or fraud."
                href="/admin/listings?filter=suspicious"
                severity={suspicious > 0 ? 'medium' : 'low'}
              />
            </div>
          </div>

          {/* ── Quick links ── */}
          <div className="border-t border-sl-slate-200 pt-6">
            <p className="text-xs font-semibold text-sl-slate-400 uppercase tracking-wide mb-3">
              Quick access
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All listings',   href: '/admin/listings'           },
                { label: 'Agent list',     href: '/admin/agents'             },
                { label: 'Audit log',      href: '/admin/audit-log'          },
                { label: 'Flagged listings', href: '/admin/listings?filter=flagged' },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-xs px-3 py-1.5 border border-sl-slate-200 rounded-lg
                             text-sl-slate-600 hover:border-sl-green-300 hover:text-sl-green-700
                             transition-colors bg-white"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function pending(n?: number) { return n ?? 0; }
function suspendedAgents(s: Stats | null) { return s?.suspendedAgents ?? 0; }
