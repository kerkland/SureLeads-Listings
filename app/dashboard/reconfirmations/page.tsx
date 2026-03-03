'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import ReconfirmationTable from '@/components/dashboard/ReconfirmationTable';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface ReconfirmListing {
  id:                        string;
  title:                     string;
  area:                      string;
  city:                      string;
  status:                    string;
  rentPerYear:               string;
  nextReconfirmationDue:     string | null;
  lastReconfirmedAt:         string | null;
  graceExpiresAt:            string | null;
  reconfirmationMissedCount: number;
}

interface Summary {
  hidden:                number;
  pendingReconfirmation: number;
  available:             number;
  total:                 number;
}

type Tab = 'action' | 'all';

/* ─── Compliance badge ───────────────────────────────────────────────────────── */

function ComplianceBadge({ rate }: { rate: number }) {
  const pct  = Math.round(rate * 100);
  const cls  = pct >= 90 ? 'bg-sl-green-50 text-sl-green-700 border-sl-green-200'
             : pct >= 70 ? 'bg-amber-50 text-amber-700 border-amber-200'
             :              'bg-red-50 text-red-700 border-red-200';
  const icon = pct >= 90 ? '✓' : pct >= 70 ? '⚠' : '✗';
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border ${cls}`}>
      {icon} {pct}% on-time
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */

export default function ReconfirmationsPage() {
  const [allListings,    setAllListings]    = useState<ReconfirmListing[]>([]);
  const [summary,        setSummary]        = useState<Summary | null>(null);
  const [complianceRate, setComplianceRate] = useState<number>(1);
  const [loading,        setLoading]        = useState(true);
  const [tab,            setTab]            = useState<Tab>('action');
  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set());
  const [bulkBusy,       setBulkBusy]       = useState(false);
  const [bulkError,      setBulkError]      = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/agent/listings/reconfirmation-status');
      const json = await res.json();
      if (json.success) {
        setAllListings(json.data.listings);
        setSummary(json.data.summary);
        setComplianceRate(json.data.complianceRate);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Filtered views ── */
  const actionListings = allListings.filter(
    (l) => l.status === 'HIDDEN' || l.status === 'PENDING_RECONFIRMATION',
  );
  const displayListings = tab === 'action' ? actionListings : allListings;

  /* ── Selection helpers ── */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    const eligible = displayListings.filter(
      (l) => ['AVAILABLE', 'PENDING_RECONFIRMATION', 'HIDDEN'].includes(l.status),
    );
    if (selectedIds.size === eligible.length) {
      setSelectedIds(new Set()); // deselect all
    } else {
      setSelectedIds(new Set(eligible.map((l) => l.id)));
    }
  };

  const allSelected =
    displayListings.length > 0 &&
    displayListings.every((l) => selectedIds.has(l.id));

  /* ── Bulk reconfirm ── */
  async function bulkReconfirm() {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    setBulkError('');
    try {
      const res  = await fetch('/api/listings/bulk-reconfirm', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ listingIds: Array.from(selectedIds) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Bulk reconfirm failed');
      setSelectedIds(new Set());
      await fetchData();
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : 'Bulk reconfirm failed');
    } finally {
      setBulkBusy(false);
    }
  }

  /* ── Single reconfirm handler (for table) ── */
  function handleSingleReconfirmed(id: string) {
    setAllListings((prev) =>
      prev.map((l) =>
        l.id === id
          ? { ...l, status: 'AVAILABLE', nextReconfirmationDue: new Date(Date.now() + 7 * 86400000).toISOString() }
          : l,
      ),
    );
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    // Refresh summary
    fetchData();
  }

  const TABS = [
    { value: 'action' as Tab, label: 'Action Required', count: actionListings.length },
    { value: 'all'    as Tab, label: 'All Verified',    count: allListings.length    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
            Agent dashboard
          </p>
          <h1 className="text-2xl font-bold text-sl-slate-900">Reconfirmations</h1>
          <p className="text-sm text-sl-slate-500 mt-0.5">
            Verified listings must be reconfirmed weekly to stay visible to tenants.
          </p>
        </div>
        {!loading && (
          <ComplianceBadge rate={complianceRate} />
        )}
      </div>

      {/* Summary stat strip */}
      {!loading && summary && (
        <div className="grid grid-cols-3 gap-3 mt-6 mb-6">
          <div className={`rounded-xl border p-4 text-center ${summary.hidden > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-sl-slate-200'}`}>
            <p className={`text-2xl font-bold ${summary.hidden > 0 ? 'text-red-600' : 'text-sl-slate-400'}`}>
              {summary.hidden}
            </p>
            <p className="text-xs text-sl-slate-500 mt-0.5">Hidden</p>
          </div>
          <div className={`rounded-xl border p-4 text-center ${summary.pendingReconfirmation > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-sl-slate-200'}`}>
            <p className={`text-2xl font-bold ${summary.pendingReconfirmation > 0 ? 'text-amber-600' : 'text-sl-slate-400'}`}>
              {summary.pendingReconfirmation}
            </p>
            <p className="text-xs text-sl-slate-500 mt-0.5">Needs Confirm</p>
          </div>
          <div className="rounded-xl border border-sl-green-200 bg-sl-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-sl-green-700">{summary.available}</p>
            <p className="text-xs text-sl-slate-500 mt-0.5">Up to Date</p>
          </div>
        </div>
      )}

      {/* Info box (shown when no action items) */}
      {!loading && actionListings.length === 0 && tab === 'action' && (
        <div className="bg-sl-green-50 border border-sl-green-200 rounded-xl p-5 mb-6 flex items-start gap-4">
          <span className="text-2xl mt-0.5">🎉</span>
          <div>
            <p className="font-semibold text-sl-green-800 text-sm">All listings are up to date</p>
            <p className="text-sl-green-700 text-xs mt-1">
              Your verified listings are confirmed and visible to tenants. SureLeads will remind you
              2 days before each weekly deadline.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sl-slate-200 mb-4">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setTab(t.value); setSelectedIds(new Set()); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2 ${
              tab === t.value
                ? 'border-sl-green-500 text-sl-green-700'
                : 'border-transparent text-sl-slate-500 hover:text-sl-slate-700'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-2xs font-bold px-1.5 py-0.5 rounded-full ${
                t.value === 'action' && t.count > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-sl-slate-100 text-sl-slate-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 flex items-center gap-3 bg-sl-slate-900 text-white rounded-xl px-4 py-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <button
            disabled={bulkBusy}
            onClick={bulkReconfirm}
            className="text-sm font-semibold bg-sl-green-500 hover:bg-sl-green-400 text-white px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {bulkBusy ? 'Reconfirming…' : `Reconfirm ${selectedIds.size} Selected`}
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-sl-slate-400 hover:text-white transition-colors ml-auto"
          >
            Clear
          </button>
          {bulkError && (
            <span className="text-xs text-red-400">{bulkError}</span>
          )}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <ReconfirmationTable
          listings={displayListings}
          onReconfirmed={handleSingleReconfirmed}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={selectAll}
          allSelected={allSelected}
        />
      )}

      {/* Back to dashboard */}
      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-sl-slate-400 hover:text-sl-green-600 transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
