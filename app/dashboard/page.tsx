'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/* ─── Types ────────────────────────────────────────────── */

interface User {
  id:       string;
  role:     'AGENT' | 'CLIENT' | 'ADMIN';
  fullName: string;
}

interface AgentListing {
  id:                    string;
  title:                 string;
  city:                  string;
  status:                string;
  tier:                  string;
  viewsCount:            number;
  rentPerYear:           string;
  nextReconfirmationDue: string | null;
  createdAt:             string;
}

interface ReconfirmSummary {
  hidden:                number;
  pendingReconfirmation: number;
  available:             number;
  total:                 number;
  complianceRate?:       number;
}

/* ─── Helpers ──────────────────────────────────────────── */

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

function DueBadge({ due, tier }: { due: string | null; tier: string }) {
  if (tier !== 'VERIFIED' || !due) return null;
  const days = daysUntil(due);
  if (days === null) return null;
  if (days > 3)
    return (
      <span className="ml-2 text-xs font-medium text-sl-green-600 bg-sl-green-50
                        px-1.5 py-0.5 rounded-full border border-sl-green-200">
        in {days}d
      </span>
    );
  if (days >= 1)
    return (
      <span className="ml-2 text-xs font-medium text-amber-700 bg-amber-50
                        px-1.5 py-0.5 rounded-full border border-amber-200">
        Due in {days}d ⚠
      </span>
    );
  if (days === 0)
    return (
      <span className="ml-2 text-xs font-medium text-red-700 bg-red-50
                        px-1.5 py-0.5 rounded-full border border-red-200">
        Due today
      </span>
    );
  return (
    <span className="ml-2 text-xs font-medium text-red-700 bg-red-50
                      px-1.5 py-0.5 rounded-full border border-red-200">
      {Math.abs(days)}d overdue
    </span>
  );
}

/* ─── Stat Tile ────────────────────────────────────────── */

function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'green' | 'amber' | 'red';
}) {
  const valueColor =
    accent === 'green' ? 'text-sl-green-600' :
    accent === 'amber' ? 'text-amber-600' :
    accent === 'red'   ? 'text-red-600' :
    'text-sl-slate-900';
  const border =
    accent === 'amber' ? 'border-amber-200 bg-amber-50' :
    accent === 'red'   ? 'border-red-200 bg-red-50' :
    'border-sl-slate-200 bg-white';
  return (
    <div className={`border rounded-xl p-5 ${border}`}>
      <p className="text-xs text-sl-slate-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
      {sub && <p className="text-xs text-sl-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Quick Action ─────────────────────────────────────── */

function QuickAction({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 bg-white border border-sl-slate-200 rounded-xl
                 p-5 hover:border-sl-green-300 hover:shadow-card transition-all group"
    >
      <div className="w-10 h-10 bg-sl-green-50 rounded-xl flex items-center justify-center
                       flex-shrink-0 group-hover:bg-sl-green-100 transition-colors">
        <svg className="w-5 h-5 text-sl-green-600" fill="none"
             stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-sl-slate-900 mb-0.5">{title}</p>
        <p className="text-xs text-sl-slate-500 leading-relaxed">{desc}</p>
      </div>
    </Link>
  );
}

/* ─── Agent Dashboard ──────────────────────────────────── */

function AgentDashboard({ user }: { user: User }) {
  const [listings,          setListings]          = useState<AgentListing[]>([]);
  const [summary,           setSummary]           = useState<ReconfirmSummary | null>(null);
  const [reconfirmListings, setReconfirmListings] = useState<{ id: string; status: string }[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [reconfirming,      setReconfirming]      = useState(false);

  async function load() {
    const token = localStorage.getItem('accessToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    try {
      const [listingsRes, reconfirmRes] = await Promise.all([
        fetch(`/api/listings?agentId=${user.id}&limit=20`, { headers }).then(
          (r) => r.json(),
        ),
        fetch('/api/agent/listings/reconfirmation-status', {
          headers,
        }).then((r) => r.json()),
      ]);
      if (listingsRes.success)  setListings(listingsRes.data ?? []);
      if (reconfirmRes.success) {
        setSummary(reconfirmRes.data?.summary ?? null);
        setReconfirmListings(reconfirmRes.data?.listings ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function reconfirmAll() {
    const ids = reconfirmListings
      .filter((l) => l.status === 'PENDING_RECONFIRMATION' || l.status === 'HIDDEN')
      .map((l) => l.id);
    if (!ids.length) return;
    setReconfirming(true);
    try {
      const token = localStorage.getItem('accessToken');
      await fetch('/api/listings/bulk-reconfirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ listingIds: ids }),
      });
      await load();
    } finally {
      setReconfirming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-sm text-sl-slate-400 animate-pulse">Loading…</div>
      </div>
    );
  }

  const totalViews     = listings.reduce((s, l) => s + (l.viewsCount ?? 0), 0);
  const activeCount    = listings.filter((l) => l.status === 'AVAILABLE').length;
  const pendingConfirm = summary?.pendingReconfirmation ?? 0;
  const hiddenCount    = summary?.hidden ?? 0;

  /* greeting */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
    'Good evening';

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-sl-green-500 uppercase
                         tracking-widest mb-1">
            Overview
          </p>
          <h1 className="text-2xl font-bold text-sl-slate-900">
            {greeting}, {user.fullName.split(' ')[0]}
          </h1>
          <p className="text-sm text-sl-slate-500 mt-1">
            {"Here's"} what{"'"}s happening with your listings today.
          </p>
        </div>
        <Link
          href="/listings/new"
          className="btn-md btn-primary whitespace-nowrap"
        >
          + New listing
        </Link>
      </div>

      {/* ── Alert banners ── */}
      {pendingConfirm > 0 && (
        <div className="mb-3 flex items-center justify-between gap-4 bg-amber-50
                         border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none"
                 stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-medium text-amber-800">
              <span className="font-bold">{pendingConfirm} listing{pendingConfirm !== 1 ? 's' : ''}</span>
              {' '}need{pendingConfirm === 1 ? 's' : ''} reconfirmation before{' '}
              {pendingConfirm === 1 ? 'it is' : 'they are'} hidden.
            </p>
          </div>
          <button
            onClick={reconfirmAll}
            disabled={reconfirming}
            className="text-xs font-semibold text-amber-700 whitespace-nowrap
                       hover:text-amber-900 underline disabled:opacity-50
                       disabled:cursor-not-allowed transition-opacity"
          >
            {reconfirming ? 'Reconfirming…' : 'Reconfirm all →'}
          </button>
        </div>
      )}

      {hiddenCount > 0 && (
        <div className="mb-3 flex items-center justify-between gap-4 bg-red-50
                         border border-red-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none"
                 stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            <p className="text-sm font-medium text-red-800">
              <span className="font-bold">{hiddenCount} listing{hiddenCount !== 1 ? 's' : ''}</span>
              {' '}{hiddenCount === 1 ? 'is' : 'are'} hidden — reactivate within your grace period.
            </p>
          </div>
          <button
            onClick={reconfirmAll}
            disabled={reconfirming}
            className="text-xs font-semibold text-red-700 whitespace-nowrap
                       hover:text-red-900 underline disabled:opacity-50
                       disabled:cursor-not-allowed transition-opacity"
          >
            {reconfirming ? 'Reconfirming…' : 'Reactivate all →'}
          </button>
        </div>
      )}

      {/* ── Stat tiles ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 mt-6">
        <StatTile label="Total listings" value={listings.length} />
        <StatTile
          label="Active"
          value={activeCount}
          accent={activeCount > 0 ? 'green' : undefined}
        />
        <StatTile
          label="Needs reconfirm"
          value={pendingConfirm}
          accent={pendingConfirm > 0 ? 'amber' : undefined}
        />
        <StatTile
          label="Auto-hidden"
          value={hiddenCount}
          accent={hiddenCount > 0 ? 'red' : undefined}
        />
      </div>

      {/* ── Performance Panel ── */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-slate-500 uppercase
                       tracking-widest mb-3 px-0.5">
          Performance
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Inspection Requests — live */}
          <div className="bg-white border border-sl-slate-200 rounded-xl p-5 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-sl-green-50 rounded-lg flex items-center
                               justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sl-green-600" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-sl-slate-500 leading-tight">
                Inspection Requests
              </p>
            </div>
            <p className="text-2xl font-bold text-sl-slate-900">0</p>
            <p className="text-xs text-sl-slate-400 mt-0.5">this month</p>
          </div>

          {/* Avg Response Time — live */}
          <div className="bg-white border border-sl-slate-200 rounded-xl p-5 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center
                               justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-500" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-sl-slate-500 leading-tight">
                Avg Response Time
              </p>
            </div>
            <p className="text-2xl font-bold text-sl-slate-300">—</p>
            <p className="text-xs text-sl-slate-400 mt-0.5">no data yet</p>
          </div>

          {/* Listing Accuracy Score — future */}
          <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-5 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-sl-slate-100 rounded-lg flex items-center
                               justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sl-slate-400" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-sl-slate-400 leading-tight">
                Listing Accuracy
              </p>
            </div>
            <p className="text-2xl font-bold text-sl-slate-300">—</p>
            <span className="inline-block text-xs text-sl-slate-400 bg-sl-slate-100
                              border border-sl-slate-200 px-2 py-0.5 rounded-full mt-1.5">
              Coming soon
            </span>
          </div>

          {/* User Ratings — future */}
          <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-5 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-sl-slate-100 rounded-lg flex items-center
                               justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-sl-slate-400" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <p className="text-xs font-medium text-sl-slate-400 leading-tight">
                User Ratings
              </p>
            </div>
            <p className="text-2xl font-bold text-sl-slate-300">—</p>
            <span className="inline-block text-xs text-sl-slate-400 bg-sl-slate-100
                              border border-sl-slate-200 px-2 py-0.5 rounded-full mt-1.5">
              Coming soon
            </span>
          </div>

        </div>
      </div>

      {/* ── Two-col layout: listings + quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Listings table (2/3 width) */}
        <div className="lg:col-span-2 min-w-0 bg-white border border-sl-slate-200
                         rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-sl-slate-100 flex items-center
                           justify-between">
            <h2 className="font-semibold text-sl-slate-900 text-sm">
              My listings
            </h2>
            <Link href="/listings/new"
                  className="text-xs text-sl-green-600 hover:underline font-medium">
              + Add listing
            </Link>
          </div>

          {listings.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <div className="w-12 h-12 bg-sl-slate-100 rounded-xl flex items-center
                               justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-sl-slate-400" fill="none"
                     stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-sl-slate-700 mb-1">
                No listings yet
              </p>
              <p className="text-xs text-sl-slate-400 mb-5">
                Create your first listing to start receiving leads.
              </p>
              <Link href="/listings/new" className="btn-md btn-primary">
                Create listing
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-sl-slate-50 border-b border-sl-slate-100">
                    {['Title', 'Status', 'Views', ''].map((h) => (
                      <th key={h}
                          className="text-left px-5 py-3 text-xs font-semibold
                                     text-sl-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing.id}
                        className={`border-t border-sl-slate-50 hover:bg-sl-slate-50
                                    transition-colors ${
                          listing.status === 'HIDDEN' ? 'opacity-60' : ''
                        }`}>
                      <td className="px-5 py-3 font-medium text-sl-slate-900 max-w-xs">
                        <span className="line-clamp-1">{listing.title}</span>
                        <DueBadge due={listing.nextReconfirmationDue}
                                  tier={listing.tier} />
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          listing.status === 'AVAILABLE'              ? 'bg-sl-green-50 text-sl-green-700' :
                          listing.status === 'PENDING_RECONFIRMATION' ? 'bg-amber-50 text-amber-700'       :
                          listing.status === 'HIDDEN'                 ? 'bg-red-50 text-red-600'            :
                          listing.status === 'RENTED'                 ? 'bg-blue-50 text-blue-700'          :
                          'bg-sl-slate-100 text-sl-slate-500'
                        }`}>
                          {listing.status === 'PENDING_RECONFIRMATION'
                            ? 'Pending confirm'
                            : listing.status.charAt(0) + listing.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sl-slate-600 text-xs">
                        {listing.viewsCount ?? 0}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/listings/${listing.id}`}
                                className="text-xs text-sl-green-600 hover:underline">
                            View
                          </Link>
                          {['PENDING_RECONFIRMATION', 'HIDDEN'].includes(listing.status) &&
                            listing.tier === 'VERIFIED' && (
                              <Link href="/dashboard/reconfirmations"
                                    className="text-xs text-amber-600 hover:underline font-medium">
                                Reconfirm →
                              </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions (1/3 width) */}
        <div className="space-y-3 min-w-0">
          <p className="text-xs font-semibold text-sl-slate-500 uppercase
                         tracking-widest px-1">
            Quick actions
          </p>

          <QuickAction
            href="/listings/new"
            title="Add a listing"
            desc="Post a new property and start receiving enquiries."
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 4v16m8-8H4" />
            }
          />

          <QuickAction
            href="/dashboard/reconfirmations"
            title="Reconfirmations"
            desc="Review and reconfirm your verified listings weekly."
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          />

          <QuickAction
            href="/dashboard/credibility"
            title="Credibility score"
            desc="See your score breakdown and how to improve it."
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            }
          />

          <QuickAction
            href="/dashboard/profile"
            title="Edit profile"
            desc="Update your agency details, bio, and service areas."
            icon={
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            }
          />

          {/* Compliance mini-card */}
          {summary && summary.total > 0 && (
            <div className="bg-white border border-sl-slate-200 rounded-xl p-5">
              <p className="text-xs font-semibold text-sl-slate-500 uppercase
                             tracking-widest mb-3">
                Compliance (12 wks)
              </p>
              <div className="flex items-end gap-2 mb-2">
                <span className={`text-2xl font-bold ${
                  (summary.complianceRate ?? 100) >= 90 ? 'text-sl-green-600' :
                  (summary.complianceRate ?? 100) >= 70 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {summary.complianceRate ?? 100}%
                </span>
                <span className="text-xs text-sl-slate-400 mb-1">on time</span>
              </div>
              <div className="h-1.5 bg-sl-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    (summary.complianceRate ?? 100) >= 90 ? 'bg-sl-green-500' :
                    (summary.complianceRate ?? 100) >= 70 ? 'bg-amber-400' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${summary.complianceRate ?? 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Client Dashboard ─────────────────────────────────── */

function ClientDashboard({ user }: { user: User }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-sl-slate-900">My Dashboard</h1>
          <p className="text-sm text-sl-slate-500 mt-1">
            Welcome back, {user.fullName}
          </p>
        </div>
        <Link href="/listings" className="btn-md btn-primary">
          Browse properties
        </Link>
      </div>
      <div className="bg-white border border-sl-slate-200 rounded-xl p-12 text-center">
        <div className="w-14 h-14 bg-sl-green-50 rounded-2xl flex items-center
                         justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-sl-green-600" fill="none"
               stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-sl-slate-900 mb-2">
          Find your next home
        </h3>
        <p className="text-sm text-sl-slate-400 mb-6">
          Browse verified listings and contact trusted agents directly.
        </p>
        <Link href="/listings" className="btn-lg btn-primary">
          Browse properties
        </Link>
      </div>
    </div>
  );
}

/* ─── Root Dashboard ───────────────────────────────────── */

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    }
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-12 h-12 bg-sl-slate-100 rounded-xl flex items-center
                         justify-center mb-2">
          <svg className="w-6 h-6 text-sl-slate-400" fill="none"
               stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-sm text-sl-slate-500 text-center">
          Please sign in to view your dashboard.
        </p>
        <Link href="/login?redirect=/dashboard" className="btn-md btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  if (user.role === 'AGENT') return <AgentDashboard user={user} />;
  return <ClientDashboard user={user} />;
}
