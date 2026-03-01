'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface User {
  id: string;
  role: 'AGENT' | 'CLIENT' | 'ADMIN';
  fullName: string;
}

interface AgentListing {
  id: string;
  title: string;
  city: string;
  status: string;
  viewsCount: number;
  rentPerYear: string;
  createdAt: string;
}

// ─── Agent Dashboard ──────────────────────────────────────────────────────────

function AgentDashboard({ user }: { user: User }) {
  const [listings, setListings] = useState<AgentListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/listings?agentId=${user.id}&limit=20`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setListings(d.data); })
      .finally(() => setLoading(false));
  }, [user.id]);

  if (loading) return <div className="p-10 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user.fullName}</p>
        </div>
        <Link href="/listings/new" className="btn-primary text-sm py-2 px-4">+ New Listing</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-1">Total Listings</p>
          <p className="text-xl font-bold text-gray-900">{listings.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-1">Active</p>
          <p className="text-xl font-bold text-brand">
            {listings.filter((l) => l.status === 'AVAILABLE').length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs text-gray-500 mb-1">Total Views</p>
          <p className="text-xl font-bold text-gray-900">
            {listings.reduce((sum, l) => sum + (l.viewsCount ?? 0), 0)}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">My Listings</h2>
          <Link href="/listings/new" className="text-sm text-brand hover:underline">+ Add listing</Link>
        </div>
        {listings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-5xl mb-4">🏠</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No listings yet</h3>
            <p className="text-gray-400 mb-6">Create your first listing to start receiving leads</p>
            <Link href="/listings/new" className="btn-primary">Create Listing</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Title</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">City</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Views</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{listing.title}</td>
                    <td className="px-5 py-3 text-gray-600">{listing.city}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        listing.status === 'AVAILABLE' ? 'bg-green-50 text-green-700' :
                        listing.status === 'PAUSED' ? 'bg-yellow-50 text-yellow-700' :
                        listing.status === 'RENTED' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{listing.viewsCount ?? 0}</td>
                    <td className="px-5 py-3">
                      <Link href={`/listings/${listing.id}`} className="text-brand hover:underline text-xs">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Client Dashboard ─────────────────────────────────────────────────────────

function ClientDashboard({ user }: { user: User }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Welcome back, {user.fullName}</p>
        </div>
        <Link href="/listings" className="btn-primary text-sm py-2 px-4">Browse Properties</Link>
      </div>

      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">🏠</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Find your next home</h3>
        <p className="text-gray-400 mb-6">
          Browse verified listings and contact agents directly. Secure inspection fee payments are coming soon.
        </p>
        <Link href="/listings" className="btn-primary">Browse Properties</Link>
      </div>
    </div>
  );
}

// ─── Root Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-gray-500">Please sign in to view your dashboard.</p>
        <Link href="/login?redirect=/dashboard" className="btn-primary">Sign In</Link>
      </div>
    );
  }

  if (user.role === 'AGENT') return <AgentDashboard user={user} />;
  return <ClientDashboard user={user} />;
}
