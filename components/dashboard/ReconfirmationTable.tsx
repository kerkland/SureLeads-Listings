'use client';

import { useState } from 'react';

interface ReconfirmListing {
  id: string;
  title: string;
  area: string;
  city: string;
  status: string;
  nextReconfirmationDue: string | null;
}

interface Props {
  listings: ReconfirmListing[];
  onReconfirmed?: (id: string) => void;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function ReconfirmationTable({ listings, onReconfirmed }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function reconfirm(id: string) {
    setLoading(id);
    setErrors((e) => ({ ...e, [id]: '' }));
    try {
      const res = await fetch(`/api/listings/${id}/reconfirm`, { method: 'POST' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      onReconfirmed?.(id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reconfirm';
      setErrors((e) => ({ ...e, [id]: message }));
    } finally {
      setLoading(null);
    }
  }

  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
        All listings are up to date.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 text-gray-600 font-medium">Listing</th>
            <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
            <th className="text-left px-4 py-3 text-gray-600 font-medium">Due</th>
            <th className="text-right px-4 py-3 text-gray-600 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {listings.map((l) => {
            const days = daysUntil(l.nextReconfirmationDue);
            const isOverdue = l.status === 'HIDDEN';
            const isPending = l.status === 'PENDING_RECONFIRMATION';

            return (
              <tr key={l.id} className={isOverdue ? 'bg-red-50' : isPending ? 'bg-amber-50' : ''}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{l.title}</div>
                  <div className="text-gray-500 text-xs">{l.area}, {l.city}</div>
                </td>
                <td className="px-4 py-3">
                  {isOverdue ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 text-xs px-2 py-0.5 font-medium">
                      Hidden
                    </span>
                  ) : isPending ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 text-xs px-2 py-0.5 font-medium">
                      Needs reconfirmation
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5 font-medium">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {days === null
                    ? '—'
                    : days < 0
                    ? <span className="text-red-600 font-medium">{Math.abs(days)}d overdue</span>
                    : days === 0
                    ? <span className="text-amber-600 font-medium">Due today</span>
                    : <span>{days}d remaining</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {errors[l.id] && <span className="text-red-500 text-xs mr-2">{errors[l.id]}</span>}
                  <button
                    onClick={() => reconfirm(l.id)}
                    disabled={loading === l.id}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading === l.id ? 'Confirming…' : isOverdue ? 'Reactivate' : 'Reconfirm'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
