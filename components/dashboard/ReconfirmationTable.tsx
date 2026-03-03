'use client';

import React, { useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────────── */

interface ReconfirmListing {
  id:                        string;
  title:                     string;
  area:                      string;
  city:                      string;
  status:                    string;
  rentPerYear:               string; // kobo as string
  nextReconfirmationDue:     string | null;
  lastReconfirmedAt:         string | null;
  graceExpiresAt:            string | null;
  reconfirmationMissedCount: number;
}

interface Props {
  listings:       ReconfirmListing[];
  onReconfirmed?: (id: string) => void;
  selectedIds?:   Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?:   () => void;
  allSelected?:   boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────────────── */

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

/** Convert kobo (BigInt-as-string) → naira whole number */
function koboToNaira(koboStr: string): number {
  return Math.round(Number(BigInt(koboStr)) / 100);
}

function formatNaira(naira: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(naira);
}

/* ─── Due date display ───────────────────────────────────────────────────────── */

function DueDisplay({
  dateStr,
  graceExpiresAt,
  status,
}: {
  dateStr:        string | null;
  graceExpiresAt: string | null;
  status:         string;
}) {
  const days = daysUntil(dateStr);

  if (status === 'HIDDEN') {
    const graceDays = daysUntil(graceExpiresAt);
    return (
      <div>
        <span className="text-red-600 font-medium text-sm">Hidden</span>
        {graceDays !== null && (
          <div className="text-xs text-sl-slate-400 mt-0.5">
            {graceDays > 0
              ? <span className="text-red-500">Expires in {graceDays}d</span>
              : <span className="text-red-700 font-semibold">Grace expired</span>}
          </div>
        )}
      </div>
    );
  }

  if (days === null) return <span className="text-sl-slate-400 text-sm">—</span>;
  if (days < 0)  return <span className="text-red-600 font-medium text-sm">{Math.abs(days)}d overdue</span>;
  if (days === 0) return <span className="text-red-600 font-semibold text-sm">Due today 🔴</span>;
  if (days <= 2)  return <span className="text-amber-600 font-medium text-sm">Due in {days}d ⚠</span>;
  return <span className="text-sl-green-700 text-sm">in {days}d</span>;
}

/* ─── Status badge ───────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  if (status === 'HIDDEN') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs px-2 py-0.5 font-semibold">
      Hidden
    </span>
  );
  if (status === 'PENDING_RECONFIRMATION') return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 font-semibold">
      Needs confirm
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sl-green-50 text-sl-green-700 border border-sl-green-200 text-xs px-2 py-0.5 font-semibold">
      Active
    </span>
  );
}

/* ─── Price expand form ──────────────────────────────────────────────────────── */

interface PriceExpandProps {
  listing:      ReconfirmListing;
  onCancel:     () => void;
  onConfirmed:  (id: string) => void;
}

function PriceExpandRow({ listing, onCancel, onConfirmed }: PriceExpandProps) {
  const currentNaira = koboToNaira(listing.rentPerYear);
  const [newNaira,  setNewNaira]  = useState<string>('');
  const [busy,      setBusy]      = useState(false);
  const [error,     setError]     = useState('');

  async function submit(withPrice: boolean) {
    setBusy(true);
    setError('');
    try {
      const body: { newRentPerYear?: number } = {};
      if (withPrice) {
        const parsed = parseInt(newNaira.replace(/,/g, ''), 10);
        if (isNaN(parsed) || parsed <= 0) {
          setError('Enter a valid rent amount in naira');
          setBusy(false);
          return;
        }
        body.newRentPerYear = parsed * 100; // naira → kobo
      }
      const res  = await fetch(`/api/listings/${listing.id}/reconfirm`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? 'Reconfirmation failed');
      onConfirmed(listing.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reconfirmation failed');
      setBusy(false);
    }
  }

  return (
    <tr>
      <td colSpan={6} className="px-4 pb-3 pt-0">
        <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-4 mt-0.5">
          <p className="text-xs font-semibold text-sl-slate-700 mb-3">
            Reconfirm — update rent? <span className="font-normal text-sl-slate-400">(optional)</span>
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <p className="text-xs text-sl-slate-400 mb-1">Current rent</p>
              <p className="text-sm font-semibold text-sl-slate-700">{formatNaira(currentNaira)}/yr</p>
            </div>
            <div className="flex-1">
              <label className="text-xs text-sl-slate-500 mb-1 block">New rent (₦/yr)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder={currentNaira.toLocaleString()}
                value={newNaira}
                onChange={(e) => setNewNaira(e.target.value)}
                className="w-full text-sm px-3 py-2 border border-sl-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sl-green-400"
              />
            </div>
          </div>
          {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
          <div className="flex gap-2">
            <button
              disabled={busy}
              onClick={() => submit(false)}
              className="text-xs font-medium px-3 py-1.5 bg-sl-green-600 text-white rounded-lg hover:bg-sl-green-700 disabled:opacity-50 transition-colors"
            >
              {busy ? 'Confirming…' : listing.status === 'HIDDEN' ? 'Reactivate (keep price)' : 'Confirm (keep price)'}
            </button>
            {newNaira && (
              <button
                disabled={busy}
                onClick={() => submit(true)}
                className="text-xs font-medium px-3 py-1.5 border border-sl-green-200 text-sl-green-700 rounded-lg hover:bg-sl-green-50 disabled:opacity-50 transition-colors"
              >
                {busy ? 'Confirming…' : 'Confirm with new price'}
              </button>
            )}
            <button
              onClick={onCancel}
              className="text-xs text-sl-slate-400 hover:text-sl-slate-600 px-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─── Main table ─────────────────────────────────────────────────────────────── */

export default function ReconfirmationTable({
  listings,
  onReconfirmed,
  selectedIds   = new Set(),
  onToggleSelect,
  onSelectAll,
  allSelected   = false,
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-sl-green-200 bg-sl-green-50 p-10 text-center">
        <p className="text-sl-green-700 font-semibold text-sm">All listings are up to date</p>
        <p className="text-sl-green-600 text-xs mt-1">No action required right now.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-sl-slate-200">
      <table className="w-full text-sm">
        <thead className="bg-sl-slate-50 border-b border-sl-slate-200">
          <tr>
            {/* Checkbox column */}
            {onSelectAll && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="rounded border-sl-slate-300 text-sl-green-600 focus:ring-sl-green-400"
                  aria-label="Select all"
                />
              </th>
            )}
            <th className="text-left px-4 py-3 text-xs font-semibold text-sl-slate-500">Listing</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sl-slate-500">Status</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sl-slate-500">Due / Expires</th>
            <th className="text-left px-4 py-3 text-xs font-semibold text-sl-slate-500">Rent</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-sl-slate-500">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sl-slate-100">
          {listings.map((l) => {
            const isExpanded = expandedId === l.id;
            const isSelected = selectedIds.has(l.id);
            const isHidden   = l.status === 'HIDDEN';
            const isPending  = l.status === 'PENDING_RECONFIRMATION';

            return (
              <React.Fragment key={l.id}>
                <tr
                  className={`transition-colors ${
                    isHidden   ? 'bg-red-50 hover:bg-red-100' :
                    isPending  ? 'bg-amber-50 hover:bg-amber-100' :
                    isSelected ? 'bg-sl-green-50' :
                    'hover:bg-sl-slate-50'
                  }`}
                >
                  {/* Checkbox */}
                  {onToggleSelect && (
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect(l.id)}
                        className="rounded border-sl-slate-300 text-sl-green-600 focus:ring-sl-green-400"
                        aria-label={`Select ${l.title}`}
                      />
                    </td>
                  )}

                  {/* Listing */}
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-medium text-sl-slate-900 truncate">{l.title}</p>
                    <p className="text-xs text-sl-slate-400 mt-0.5">{l.area}, {l.city}</p>
                    {l.reconfirmationMissedCount > 0 && (
                      <p className="text-2xs text-red-500 mt-0.5">{l.reconfirmationMissedCount} missed</p>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>

                  {/* Due / Expires */}
                  <td className="px-4 py-3">
                    <DueDisplay
                      dateStr={l.nextReconfirmationDue}
                      graceExpiresAt={l.graceExpiresAt}
                      status={l.status}
                    />
                  </td>

                  {/* Rent */}
                  <td className="px-4 py-3 text-sl-slate-600 whitespace-nowrap">
                    {formatNaira(koboToNaira(l.rentPerYear))}<span className="text-sl-slate-400">/yr</span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : l.id)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        isExpanded
                          ? 'border-sl-slate-200 text-sl-slate-500 hover:bg-sl-slate-50'
                          : isHidden
                          ? 'bg-sl-green-600 text-white border-sl-green-600 hover:bg-sl-green-700'
                          : isPending
                          ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700'
                          : 'border-sl-green-200 text-sl-green-700 hover:bg-sl-green-50'
                      }`}
                    >
                      {isExpanded
                        ? 'Cancel'
                        : isHidden
                        ? 'Reactivate'
                        : 'Reconfirm'}
                    </button>
                  </td>
                </tr>

                {/* Price expand row */}
                {isExpanded && (
                  <PriceExpandRow
                    listing={l}
                    onCancel={() => setExpandedId(null)}
                    onConfirmed={(id) => {
                      setExpandedId(null);
                      onReconfirmed?.(id);
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
