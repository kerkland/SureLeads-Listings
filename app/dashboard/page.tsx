'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

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
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function DueBadge({ due, tier }: { due: string | null; tier: string }) {
  if (tier !== 'VERIFIED' || !due) return null;
  const days = daysUntil(due);
  if (days === null) return null;
  if (days > 3) return (
    <span className="ml-2 text-2xs font-medium text-sl-green-600 bg-sl-green-50 px-1.5 py-0.5 rounded-full border border-sl-green-200">
      in {days}d
    </span>
  );
  if (days >= 1) return (
    <span className="ml-2 text-2xs font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
      Due in {days}d ⚠
    </span>
  );
  if (days === 0) return (
    <span className="ml-2 text-2xs font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
      Due today 🔴
    </span>
  );
  return (
    <span className="ml-2 text-2xs font-medium text-red-700 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">
      {Math.abs(days)}d overdue
    </span>
  );
}

/* ─── Agent Dashboard ──────────────────────────────────────────────────────── */

function AgentDashboard({ user }: { user: User }) {
  const [listings,  setListings]  = useState<AgentListing[]>([]);
  const [summary,   setSummary]   = useState<ReconfirmSummary | null>(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [listingsRes, reconfirmRes] = await Promise.all([
          fetch(`/api/listings?agentId=${user.id}&limit=20`).then((r) => r.json()),
          fetch('/api/agent/listings/reconfirmation-status').then((r) => r.json()),
        ]);
        if (listingsRes.success)  setListings(listingsRes.data);
        if (reconfirmRes.success) setSummary(reconfirmRes.data.summary);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user.id]);

  if (loading) return <div className="p-10 text-center text-sl-slate-400 animate-pulse">Loading…</div>;

  const totalViews  = listings.reduce((s, l) => s + (l.viewsCount ?? 0), 0);
  const activeCount = listings.filter((l) => l.status === 'AVAILABLE').length;
  const pendingConfirm = summary?.pendingReconfirmation ?? 0;
  const hiddenCount    = summary?.hidden ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-0.5">
            Agent Dashboard
          </p>
          <h1 className="text-2xl font-bold text-sl-slate-900">Welcome back, {user.fullName}</h1>
        </div>
        <Link
          href="/listings/new"
          className="text-sm font-semibold bg-sl-green-600 text-white px-4 py-2 rounded-xl hover:bg-sl-green-700 transition-colors"
        >
          + New Listing
        </Link>
      </div>

      {/* Reconfirmation Alert Banners */}
      {pendingConfirm > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-medium text-amber-800">
              <span className="font-bold">{pendingConfirm} listing{pendingConfirm !== 1 ? 's' : ''}</span>
              {' '}need{pendingConfirm === 1 ? 's' : ''} reconfirmation before {pendingConfirm === 1 ? 'it is' : 'they are'} hidden.
            </p>
          </div>
          <Link
            href="/dashboard/reconfirmations"
            className="text-xs font-semibold text-amber-700 whitespace-nowrap underline hover:text-amber-900"
          >
            Reconfirm now →
          </Link>
        </div>
      )}

      {hiddenCount > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔴</span>
            <p className="text-sm font-medium text-red-800">
              <span className="font-bold">{hiddenCount} listing{hiddenCount !== 1 ? 's' : ''}</span>
              {' '}{hiddenCount === 1 ? 'is' : 'are'} hidden — reactivate within your grace period to restore visibility.
            </p>
          </div>
          <Link
            href="/dashboard/reconfirmations"
            className="text-xs font-semibold text-red-700 whitespace-nowrap underline hover:text-red-900"
          >
            Reactivate →
          </Link>
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <div className="col-span-1 bg-white border border-sl-slate-200 rounded-xl p-5">
          <p className="text-xs text-sl-slate-500 mb-1">Total Listings</p>
          <p className="text-xl font-bold text-sl-slate-900">{listings.length}</p>
        </div>
        <div className="col-span-1 bg-white border border-sl-slate-200 rounded-xl p-5">
          <p className="text-xs text-sl-slate-500 mb-1">Active</p>
          <p className="text-xl font-bold text-sl-green-600">{activeCount}</p>
        </div>
        <div className="col-span-1 bg-white border border-sl-slate-200 rounded-xl p-5">
          <p className="text-xs text-sl-slate-500 mb-1">Total Views</p>
          <p className="text-xl font-bold text-sl-slate-900">{totalViews}</p>
        </div>
        <div className={`col-span-1 rounded-xl p-5 border ${
          pendingConfirm > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-white border-sl-slate-200'
        }`}>
          <p className="text-xs text-sl-slate-500 mb-1">Needs Confirm</p>
          <p className={`text-xl font-bold ${pendingConfirm > 0 ? 'text-amber-600' : 'text-sl-slate-400'}`}>
            {pendingConfirm}
          </p>
        </div>
        <div className={`col-span-1 rounded-xl p-5 border ${
          hiddenCount > 0
            ? 'bg-red-50 border-red-200'
            : 'bg-white border-sl-slate-200'
        }`}>
          <p className="text-xs text-sl-slate-500 mb-1">Auto-hidden</p>
          <p className={`text-xl font-bold ${hiddenCount > 0 ? 'text-red-600' : 'text-sl-slate-400'}`}>
            {hiddenCount}
          </p>
        </div>
      </div>

      {/* Listings table */}
      <div className="bg-white border border-sl-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-sl-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-sl-slate-900">My Listings</h2>
          <Link href="/listings/new" className="text-sm text-sl-green-600 hover:underline">
            + Add listing
          </Link>
        </div>

        {listings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-sl-slate-700 mb-2">No listings yet</h3>
            <p className="text-sl-slate-400 mb-6">Create your first listing to start receiving leads</p>
            <Link
              href="/listings/new"
              className="bg-sl-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sl-green-700 transition-colors"
            >
              Create Listing
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sl-slate-50 border-b border-sl-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-sl-slate-500">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-sl-slate-500">City</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-sl-slate-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-sl-slate-500">Views</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-sl-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr
                    key={listing.id}
                    className={`border-t border-sl-slate-50 hover:bg-sl-slate-50 transition-colors ${
                      listing.status === 'HIDDEN' ? 'opacity-70' : ''
                    }`}
                  >
                    <td className="px-5 py-3 font-medium text-sl-slate-900">
                      {listing.title}
                      <DueBadge due={listing.nextReconfirmationDue} tier={listing.tier} />
                    </td>
                    <td className="px-5 py-3 text-sl-slate-600">{listing.city}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        listing.status === 'AVAILABLE'              ? 'bg-sl-green-50 text-sl-green-700' :
                        listing.status === 'PENDING_RECONFIRMATION' ? 'bg-amber-50 text-amber-700'       :
                        listing.status === 'HIDDEN'                 ? 'bg-red-50 text-red-600'            :
                        listing.status === 'PAUSED'                 ? 'bg-yellow-50 text-yellow-700'      :
                        listing.status === 'RENTED'                 ? 'bg-blue-50 text-blue-700'          :
                        'bg-sl-slate-100 text-sl-slate-500'
                      }`}>
                        {listing.status === 'PENDING_RECONFIRMATION' ? 'Pending Confirm' : listing.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sl-slate-600">{listing.viewsCount ?? 0}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/listings/${listing.id}`}
                          className="text-sl-green-600 hover:underline text-xs"
                        >
                          View
                        </Link>
                        {['PENDING_RECONFIRMATION', 'HIDDEN'].includes(listing.status) && listing.tier === 'VERIFIED' && (
                          <Link
                            href="/dashboard/reconfirmations"
                            className="text-amber-600 hover:underline text-xs font-medium"
                          >
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

      {/* Quick link to reconfirmations */}
      {(summary?.total ?? 0) > 0 && (
        <div className="mt-4 text-right">
          <Link
            href="/dashboard/reconfirmations"
            className="text-xs text-sl-slate-400 hover:text-sl-green-600 transition-colors"
          >
            Manage all reconfirmations →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Client Dashboard ────────────────────────────────────────────────────── */

function ClientDashboard({ user }: { user: User }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-sl-slate-900">My Dashboard</h1>
          <p className="text-sm text-sl-slate-500 mt-0.5">Welcome back, {user.fullName}</p>
        </div>
        <Link
          href="/listings"
          className="text-sm font-semibold bg-sl-green-600 text-white px-4 py-2 rounded-xl hover:bg-sl-green-700 transition-colors"
        >
          Browse Properties
        </Link>
      </div>

      <div className="bg-white border border-sl-slate-200 rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-sl-slate-700 mb-2">Find your next home</h3>
        <p className="text-sl-slate-400 mb-6">
          Browse verified listings and contact agents directly.
        </p>
        <Link
          href="/listings"
          className="bg-sl-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sl-green-700 transition-colors"
        >
          Browse Properties
        </Link>
      </div>
    </div>
  );
}

/* ─── Root Dashboard ──────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sl-slate-500">Please sign in to view your dashboard.</p>
        <Link
          href="/login?redirect=/dashboard"
          className="bg-sl-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-sl-green-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (user.role === 'AGENT') return <AgentDashboard user={user} />;
  return <ClientDashboard user={user} />;
}
