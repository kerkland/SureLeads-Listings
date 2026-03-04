'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface UserRow {
  id:              string;
  fullName:        string;
  phone:           string;
  email:           string | null;
  isVerified:      boolean;
  isSuspended:     boolean;
  suspendedAt:     string | null;
  inspectionCount: number;
  createdAt:       string;
}

type StatusFilter = 'all' | 'active' | 'suspended';

/* ─── Inline suspend form ─────────────────────────────────────────────────── */

function SuspendForm({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [reason, setReason] = useState('');
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState('');

  async function submit(action: 'SUSPEND' | 'REINSTATE') {
    setBusy(true);
    setErr('');
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action, ...(action === 'SUSPEND' && reason ? { reason } : {}) }),
    }).then((r) => r.json());
    setBusy(false);
    if (res.success) { onSaved(); onClose(); }
    else setErr(typeof res.error === 'string' ? res.error : 'Failed');
  }

  if (user.isSuspended) {
    return (
      <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl p-4 mt-2">
        <p className="text-xs text-sl-slate-700 mb-3">
          Reinstate <strong>{user.fullName}</strong>? This will allow them to use the platform again.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => submit('REINSTATE')}
            disabled={busy}
            className="text-xs px-3 py-1.5 bg-sl-green-500 text-white rounded-lg hover:bg-sl-green-600 disabled:opacity-50 transition-colors"
          >
            {busy ? 'Saving…' : 'Reinstate'}
          </button>
          <button onClick={onClose} className="text-xs text-sl-slate-400 hover:text-sl-slate-600">Cancel</button>
        </div>
        {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
      </div>
    );
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-2">
      <p className="text-xs font-semibold text-red-700 mb-2">Suspend {user.fullName}</p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for suspension (optional)"
        rows={2}
        className="w-full text-xs border border-red-200 rounded-lg px-3 py-2 bg-white resize-none mb-3"
      />
      <div className="flex gap-2">
        <button
          onClick={() => submit('SUSPEND')}
          disabled={busy}
          className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {busy ? 'Saving…' : 'Confirm suspend'}
        </button>
        <button onClick={onClose} className="text-xs text-sl-slate-400 hover:text-sl-slate-600">Cancel</button>
      </div>
      {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function UsersPage() {
  const [users,      setUsers]      = useState<UserRow[]>([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status,     setStatus]     = useState<StatusFilter>('all');
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [actionId,   setActionId]   = useState<string | null>(null);
  const searchRef = useRef('');

  const load = useCallback(async (s: string = searchRef.current) => {
    setLoading(true);
    const qs  = new URLSearchParams({ page: String(page), limit: '25', status, ...(s ? { search: s } : {}) });
    const res = await fetch(`/api/admin/users?${qs}`).then((r) => r.json());
    if (res.success) {
      setUsers(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages ?? 1);
    }
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  function handleSearchKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { searchRef.current = search; setPage(1); load(search); }
  }

  function exportCSV() {
    const rows = [
      ['Name', 'Phone', 'Email', 'Verified', 'Status', 'Inspections', 'Joined'],
      ...users.map((u) => [
        u.fullName, u.phone, u.email ?? '',
        u.isVerified ? 'Yes' : 'No',
        u.isSuspended ? 'Suspended' : 'Active',
        String(u.inspectionCount),
        new Date(u.createdAt).toLocaleDateString(),
      ]),
    ];
    const csv  = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'users.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const TABS: { key: StatusFilter; label: string }[] = [
    { key: 'all',       label: 'All users'  },
    { key: 'active',    label: 'Active'     },
    { key: 'suspended', label: 'Suspended'  },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">Admin</p>
          <h1 className="text-2xl font-bold text-sl-slate-900">Client Users</h1>
          <p className="text-sm text-sl-slate-500 mt-0.5">{total.toLocaleString()} registered clients</p>
        </div>
        <button
          onClick={exportCSV}
          className="text-xs font-medium px-3 py-2 border border-sl-slate-200 rounded-lg
                     text-sl-slate-600 hover:border-sl-slate-300 bg-white transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKey}
          placeholder="Search name, phone, email… (Enter)"
          className="flex-1 min-w-48 text-sm border border-sl-slate-200 rounded-lg px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-sl-green-300"
        />
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => { setStatus(t.key); setPage(1); }}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                status === t.key
                  ? 'bg-sl-green-500 text-white border-sl-green-500'
                  : 'bg-white text-sl-slate-600 border-sl-slate-200 hover:border-sl-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 bg-sl-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-sl-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sl-slate-100 text-xs text-sl-slate-400 uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">User</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Contact</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Inspections</th>
                <th className="px-4 py-3 text-left font-medium hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <React.Fragment key={u.id}>
                  <tr className="border-t border-sl-slate-50 hover:bg-sl-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sl-slate-900">{u.fullName}</p>
                      {u.isVerified && (
                        <p className="text-2xs text-sl-green-600 font-medium">✓ Verified</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs text-sl-slate-600">{u.phone}</p>
                      {u.email && <p className="text-xs text-sl-slate-400">{u.email}</p>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-sm text-sl-slate-600">
                      {u.inspectionCount}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-sl-slate-400">
                      {new Date(u.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                    </td>
                    <td className="px-4 py-3">
                      {u.isSuspended ? (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full bg-sl-green-50 text-sl-green-700 border border-sl-green-200">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setActionId(actionId === u.id ? null : u.id)}
                        className={`text-xs font-medium transition-colors ${
                          u.isSuspended
                            ? 'text-sl-green-600 hover:text-sl-green-700'
                            : 'text-red-600 hover:text-red-700'
                        }`}
                      >
                        {u.isSuspended ? 'Reinstate' : 'Suspend'}
                      </button>
                    </td>
                  </tr>
                  {actionId === u.id && (
                    <tr className="border-t border-sl-slate-50">
                      <td colSpan={6} className="px-4 pb-3">
                        <SuspendForm
                          user={u}
                          onClose={() => setActionId(null)}
                          onSaved={load}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-sl-slate-400">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-6">
          {page > 1 && (
            <button onClick={() => setPage((p) => p - 1)}
              className="w-8 h-8 rounded-lg border border-sl-slate-200 text-sm text-sl-slate-600">←</button>
          )}
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-medium ${
                p === page ? 'bg-sl-green-500 text-white' : 'border border-sl-slate-200 text-sl-slate-600'
              }`}>{p}</button>
          ))}
          {page < totalPages && (
            <button onClick={() => setPage((p) => p + 1)}
              className="w-8 h-8 rounded-lg border border-sl-slate-200 text-sm text-sl-slate-600">→</button>
          )}
        </div>
      )}
    </div>
  );
}
