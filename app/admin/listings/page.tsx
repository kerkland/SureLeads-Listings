'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ListingRow {
  id:              string;
  title:           string;
  city:            string;
  area:            string;
  propertyType:    string;
  bedrooms:        number;
  rentPerYear:     string; // serialised BigInt (kobo)
  status:          string;
  tier:            'BASIC' | 'VERIFIED';
  isAdminFlagged:  boolean;
  isSuspicious:    boolean;
  suspiciousReason: string;
  agent: {
    fullName: string;
    agentProfile: {
      id:             string;
      agencyName:     string | null;
      credibilityTier: string;
    } | null;
  };
}

type Filter = 'all' | 'flagged' | 'suspicious' | 'hidden';

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function fmtRent(koboStr: string) {
  const naira = Math.round(Number(koboStr) / 100);
  if (naira >= 1_000_000) return `₦${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 1_000)     return `₦${(naira / 1_000).toFixed(0)}k`;
  return `₦${naira}`;
}

const TIER_CHIP: Record<string, string> = {
  VERIFIED: 'bg-sl-green-100 text-sl-green-700 border border-sl-green-200',
  BASIC:    'bg-sl-slate-100 text-sl-slate-600 border border-sl-slate-200',
};

const STATUS_CHIP: Record<string, string> = {
  AVAILABLE:              'bg-green-50 text-green-700',
  HIDDEN:                 'bg-sl-slate-100 text-sl-slate-500',
  PENDING_RECONFIRMATION: 'bg-sl-gold-50 text-sl-gold-700',
  PAUSED:                 'bg-sl-slate-100 text-sl-slate-400',
  RENTED:                 'bg-blue-50 text-blue-600',
};

/* ─── CSV export ─────────────────────────────────────────────────────────── */

function exportCSV(listings: ListingRow[]) {
  const headers = ['ID', 'Title', 'Agent', 'Agency', 'City', 'Area', 'Type', 'Beds', 'Rent/yr (₦)', 'Tier', 'Status', 'Flagged', 'Suspicious'];
  const rows = listings.map((l) => [
    l.id,
    `"${l.title.replace(/"/g, '""')}"`,
    `"${l.agent.fullName}"`,
    `"${l.agent.agentProfile?.agencyName ?? ''}"`,
    l.city,
    l.area,
    l.propertyType,
    l.bedrooms,
    Math.round(Number(l.rentPerYear) / 100),
    l.tier,
    l.status,
    l.isAdminFlagged ? 'Yes' : 'No',
    l.isSuspicious   ? 'Yes' : 'No',
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  const a   = document.createElement('a');
  a.href     = url;
  a.download = `listings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function Chip({ label, cls }: { label: string; cls: string }) {
  return (
    <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {label}
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AdminListingsPage() {
  const [filter,      setFilter]      = useState<Filter>('all');
  const [listings,    setListings]    = useState<ListingRow[]>([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [busy,        setBusy]        = useState<string | null>(null);
  // Inline force-hide form state
  const [hideTarget,  setHideTarget]  = useState<string | null>(null); // listingId
  const [hideReason,  setHideReason]  = useState('');
  // Bulk select state
  const [selected,    setSelected]    = useState<Set<string>>(new Set());
  const [bulkBusy,    setBulkBusy]    = useState(false);

  const limit = 25;

  const load = useCallback(() => {
    setLoading(true);
    setSelected(new Set()); // clear selection on load
    fetch(`/api/admin/listings?filter=${filter}&page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setListings(j.data);
          setTotal(j.total);
        }
      })
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  /* Reset page when filter changes */
  const changeFilter = (f: Filter) => { setFilter(f); setPage(1); };

  /* ── Select helpers ── */
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === listings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(listings.map((l) => l.id)));
    }
  };

  /* ── Actions ── */
  async function toggleFlag(l: ListingRow) {
    setBusy(l.id);
    const url   = l.isAdminFlagged ? `/api/admin/listings/${l.id}/unflag` : `/api/admin/listings/${l.id}/flag`;
    const method = 'PATCH';
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setBusy(null);
    load();
  }

  async function submitHide(listingId: string) {
    setBusy(listingId);
    await fetch(`/api/admin/listings/${listingId}/force-hide`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ reason: hideReason.trim() || undefined }),
    });
    setBusy(null);
    setHideTarget(null);
    setHideReason('');
    load();
  }

  async function changeTier(l: ListingRow, tier: 'BASIC' | 'VERIFIED') {
    setBusy(l.id);
    await fetch(`/api/admin/listings/${l.id}/tier`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });
    setBusy(null);
    load();
  }

  /* ── Bulk hide ── */
  async function bulkHide() {
    if (!selected.size) return;
    setBulkBusy(true);
    const ids = Array.from(selected);
    await Promise.all(ids.map((id) =>
      fetch(`/api/admin/listings/${id}/force-hide`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reason: 'Bulk hide by admin' }),
      })
    ));
    setBulkBusy(false);
    load();
  }

  const pages = Math.ceil(total / limit);

  const TABS: { label: string; value: Filter }[] = [
    { label: 'All',             value: 'all'        },
    { label: 'Flagged',         value: 'flagged'    },
    { label: 'Suspicious Price',value: 'suspicious' },
    { label: 'Hidden',          value: 'hidden'     },
  ];

  const allSelected    = listings.length > 0 && selected.size === listings.length;
  const someSelected   = selected.size > 0 && !allSelected;
  const selectedListing = listings.filter((l) => selected.has(l.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
            Admin console
          </p>
          <h1 className="text-2xl font-bold text-sl-slate-900">Listings</h1>
          <p className="text-sm text-sl-slate-500 mt-0.5">
            Review, flag, hide, and manage listing tiers
          </p>
        </div>
        <button
          onClick={() => exportCSV(listings)}
          disabled={listings.length === 0}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 border border-sl-slate-200
                     text-sl-slate-700 rounded-lg hover:bg-sl-slate-50 disabled:opacity-40 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-sl-slate-800 text-white rounded-xl px-4 py-3 mb-4 flex-wrap">
          <span className="text-sm font-medium">
            {selected.size} listing{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex-1" />
          <button
            onClick={() => exportCSV(selectedListing)}
            className="text-xs font-medium px-3 py-1.5 border border-sl-slate-500 rounded-lg
                       hover:bg-sl-slate-700 transition-colors"
          >
            Export selected
          </button>
          <button
            disabled={bulkBusy}
            onClick={bulkHide}
            className="text-xs font-medium px-3 py-1.5 bg-red-600 rounded-lg
                       hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {bulkBusy ? 'Hiding…' : `Hide ${selected.size} listing${selected.size !== 1 ? 's' : ''}`}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-sl-slate-400 hover:text-white transition-colors px-2"
          >
            Clear
          </button>
        </div>
      )}

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
        {loading ? 'Loading…' : `${total} listing${total !== 1 ? 's' : ''}`}
      </p>

      {/* Table */}
      <div className="bg-white border border-sl-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sl-slate-50 border-b border-sl-slate-200">
              <tr>
                {/* Select all checkbox */}
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-sl-slate-300 text-sl-green-600
                               focus:ring-sl-green-400 cursor-pointer"
                  />
                </th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-4 py-3">Title / Agent</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">City</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Rent/yr</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Tier</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Flags</th>
                <th className="text-right text-xs font-semibold text-sl-slate-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sl-slate-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-sl-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-sl-slate-400 text-sm">
                    No listings match this filter
                  </td>
                </tr>
              ) : (
                listings.map((l) => {
                  const isBusy       = busy === l.id;
                  const isSelected   = selected.has(l.id);
                  const showHideForm = hideTarget === l.id;
                  return (
                    <React.Fragment key={l.id}>
                    <tr
                      className={`hover:bg-sl-slate-50 transition-colors ${
                        l.isSuspicious ? 'border-l-4 border-l-amber-400' : ''
                      } ${isSelected ? 'bg-sl-green-50/50' : ''}`}
                    >
                      {/* Row checkbox */}
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(l.id)}
                          className="w-4 h-4 rounded border-sl-slate-300 text-sl-green-600
                                     focus:ring-sl-green-400 cursor-pointer"
                        />
                      </td>

                      {/* Title / Agent */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-sl-slate-900 truncate">{l.title}</p>
                        <p className="text-xs text-sl-slate-400 truncate mt-0.5">
                          {l.agent.fullName}
                          {l.agent.agentProfile?.agencyName && ` · ${l.agent.agentProfile.agencyName}`}
                        </p>
                        {l.isSuspicious && (
                          <p className="text-2xs text-amber-600 font-medium mt-0.5">
                            ⚠ {l.suspiciousReason}
                          </p>
                        )}
                      </td>

                      {/* City */}
                      <td className="px-3 py-3 text-sl-slate-600 whitespace-nowrap">
                        {l.city}
                      </td>

                      {/* Type */}
                      <td className="px-3 py-3 text-sl-slate-600 whitespace-nowrap">
                        {l.propertyType} · {l.bedrooms}bed
                      </td>

                      {/* Rent */}
                      <td className="px-3 py-3 font-medium text-sl-slate-900 whitespace-nowrap">
                        {fmtRent(l.rentPerYear)}
                      </td>

                      {/* Tier */}
                      <td className="px-3 py-3">
                        <Chip label={l.tier} cls={TIER_CHIP[l.tier] ?? ''} />
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3">
                        <Chip
                          label={l.status.replace(/_/g, ' ')}
                          cls={STATUS_CHIP[l.status] ?? 'bg-sl-slate-100 text-sl-slate-500'}
                        />
                      </td>

                      {/* Flags */}
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {l.isAdminFlagged && (
                            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                              Flagged
                            </span>
                          )}
                          {l.isSuspicious && (
                            <span className="text-2xs font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                              Price
                            </span>
                          )}
                          {!l.isAdminFlagged && !l.isSuspicious && (
                            <span className="text-2xs text-sl-slate-300">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          {/* View */}
                          <Link
                            href={`/listings/${l.id}`}
                            target="_blank"
                            className="text-xs text-sl-slate-500 hover:text-sl-slate-700 underline underline-offset-2"
                          >
                            View
                          </Link>

                          {/* Flag / Unflag */}
                          <button
                            disabled={isBusy}
                            onClick={() => toggleFlag(l)}
                            className={`text-xs font-medium px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                              l.isAdminFlagged
                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                : 'border-sl-slate-200 text-sl-slate-600 hover:bg-sl-slate-50'
                            }`}
                          >
                            {l.isAdminFlagged ? 'Unflag' : 'Flag'}
                          </button>

                          {/* Force hide */}
                          {l.status !== 'HIDDEN' && (
                            <button
                              disabled={isBusy}
                              onClick={() => {
                                setHideTarget(showHideForm ? null : l.id);
                                setHideReason('');
                              }}
                              className={`text-xs font-medium px-2 py-1 rounded border transition-colors disabled:opacity-50 ${
                                showHideForm
                                  ? 'border-sl-slate-300 text-sl-slate-800 bg-sl-slate-100'
                                  : 'border-sl-slate-200 text-sl-slate-600 hover:bg-sl-slate-50'
                              }`}
                            >
                              {showHideForm ? 'Cancel' : 'Hide'}
                            </button>
                          )}

                          {/* Tier toggle */}
                          {l.tier === 'BASIC' ? (
                            <button
                              disabled={isBusy}
                              onClick={() => changeTier(l, 'VERIFIED')}
                              className="text-xs font-medium px-2 py-1 rounded border border-sl-green-200 text-sl-green-700 hover:bg-sl-green-50 transition-colors disabled:opacity-50"
                            >
                              Promote
                            </button>
                          ) : (
                            <button
                              disabled={isBusy}
                              onClick={() => changeTier(l, 'BASIC')}
                              className="text-xs font-medium px-2 py-1 rounded border border-sl-slate-200 text-sl-slate-600 hover:bg-sl-slate-50 transition-colors disabled:opacity-50"
                            >
                              Demote
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Inline force-hide form */}
                    {showHideForm && (
                      <tr>
                        <td colSpan={9} className="px-4 pb-3 pt-1 bg-sl-slate-50">
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              value={hideReason}
                              onChange={(e) => setHideReason(e.target.value)}
                              placeholder="Reason for hiding (optional)"
                              className="flex-1 min-w-0 text-xs px-3 py-1.5 border border-sl-slate-300 rounded-lg
                                         focus:outline-none focus:ring-2 focus:ring-sl-green-400"
                            />
                            <button
                              disabled={isBusy}
                              onClick={() => submitHide(l.id)}
                              className="text-xs font-medium px-3 py-1.5 bg-sl-slate-800 text-white rounded-lg
                                         hover:bg-sl-slate-900 disabled:opacity-50 transition-colors whitespace-nowrap"
                            >
                              {isBusy ? 'Hiding…' : 'Confirm hide'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-sl-slate-400">
            Page {page} of {pages}
          </p>
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
