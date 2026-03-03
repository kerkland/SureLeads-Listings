'use client';

import { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface AuditAction {
  id:         string;
  actionType: string;
  reason:     string | null;
  createdAt:  string;
  admin: { fullName: string };
  targetListing:  { title: string } | null;
  targetAgent:    { agencyName: string | null; user: { fullName: string } } | null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function actionBadge(type: string): string {
  if (/APPROVE|REINSTATE|VERIFY/.test(type))    return 'bg-sl-green-50 text-sl-green-700 border border-sl-green-200';
  if (/SUSPEND|FLAG|HIDE|REJECT/.test(type))    return 'bg-red-50 text-red-600 border border-red-200';
  if (/OVERRIDE|PROMOTE|DEMOTE/.test(type))     return 'bg-sl-gold-50 text-sl-gold-700 border border-sl-gold-200';
  if (/DISMISS|RESOLVE|UNFLAG/.test(type))      return 'bg-sl-slate-100 text-sl-slate-600 border border-sl-slate-200';
  return 'bg-sl-slate-100 text-sl-slate-500 border border-sl-slate-200';
}

function fmtType(type: string) {
  return type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

const ACTION_TYPES = [
  'ALL',
  'APPROVE_VIDEO_WALKTHROUGH',
  'REJECT_VIDEO_WALKTHROUGH',
  'SUSPEND_AGENT',
  'REINSTATE_AGENT',
  'FLAG_LISTING',
  'UNFLAG_LISTING',
  'DISMISS_REVIEW',
  'RESOLVE_COMPLAINT',
  'FORCE_HIDE_LISTING',
  'APPROVE_AGENT_VERIFICATION',
  'OVERRIDE_CREDIBILITY_SCORE',
  'PROMOTE_LISTING_TIER',
  'DEMOTE_LISTING_TIER',
];

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function AuditLogPage() {
  const [actions,  setActions]  = useState<AuditAction[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [filter,   setFilter]   = useState('ALL');
  const [loading,  setLoading]  = useState(true);

  const limit = 50;

  const load = useCallback(() => {
    setLoading(true);
    const typeParam = filter !== 'ALL' ? `&actionType=${filter}` : '';
    fetch(`/api/admin/actions?page=${page}&limit=${limit}${typeParam}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) { setActions(j.data); setTotal(j.total); }
      })
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => { load(); }, [load]);

  const changeFilter = (f: string) => { setFilter(f); setPage(1); };
  const pages = Math.ceil(total / limit);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
          Admin console
        </p>
        <h1 className="text-2xl font-bold text-sl-slate-900">Audit Log</h1>
        <p className="text-sm text-sl-slate-500 mt-0.5">
          Full history of admin actions taken on the platform
        </p>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-6">
        <label className="text-xs font-medium text-sl-slate-500">Filter by action</label>
        <select
          value={filter}
          onChange={(e) => changeFilter(e.target.value)}
          className="text-sm border border-sl-slate-200 rounded-lg px-3 py-1.5 bg-white
                     text-sl-slate-700 focus:outline-none focus:ring-2 focus:ring-sl-green-400"
        >
          {ACTION_TYPES.map((t) => (
            <option key={t} value={t}>{t === 'ALL' ? 'All actions' : fmtType(t)}</option>
          ))}
        </select>
        <span className="text-xs text-sl-slate-400 ml-auto">
          {loading ? 'Loading…' : `${total} record${total !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white border border-sl-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sl-slate-50 border-b border-sl-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-4 py-3">Action</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Target</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Reason</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-3 py-3">Admin</th>
                <th className="text-left text-xs font-semibold text-sl-slate-500 px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sl-slate-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-sl-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : actions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-sl-slate-400 text-sm">
                    No audit records found
                  </td>
                </tr>
              ) : (
                actions.map((a) => {
                  const target = a.targetListing?.title
                    ?? a.targetAgent?.user.fullName
                    ?? '—';
                  return (
                    <tr key={a.id} className="hover:bg-sl-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`text-2xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${actionBadge(a.actionType)}`}>
                          {fmtType(a.actionType)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sl-slate-700 max-w-xs">
                        <p className="truncate">{target}</p>
                      </td>
                      <td className="px-3 py-3 text-sl-slate-500 max-w-xs">
                        {a.reason
                          ? <p className="text-xs truncate">{a.reason}</p>
                          : <span className="text-sl-slate-300">—</span>
                        }
                      </td>
                      <td className="px-3 py-3 text-sl-slate-600 whitespace-nowrap">
                        {a.admin.fullName}
                      </td>
                      <td className="px-4 py-3 text-sl-slate-400 text-xs whitespace-nowrap">
                        {new Date(a.createdAt).toLocaleString('en-NG', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
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
          <p className="text-xs text-sl-slate-400">Page {page} of {pages}</p>
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
