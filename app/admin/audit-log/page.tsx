'use client';

import { useEffect, useState } from 'react';

interface Action {
  id: string;
  actionType: string;
  reason: string | null;
  createdAt: string;
  admin: { fullName: string };
  targetListing: { title: string } | null;
  targetAgent: { agencyName: string | null; user: { fullName: string } } | null;
}

export default function AuditLogPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/actions?limit=50')
      .then(r => r.json())
      .then(j => { if (j.success) setActions(j.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Audit Log</h1>
      {loading ? <p className="text-gray-500">Loading...</p> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600">Action</th>
                <th className="text-left px-4 py-3 text-gray-600">Target</th>
                <th className="text-left px-4 py-3 text-gray-600">Admin</th>
                <th className="text-left px-4 py-3 text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {actions.map(a => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{a.actionType}</span>
                    {a.reason && <p className="text-gray-500 text-xs mt-0.5">{a.reason}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.targetListing?.title ?? a.targetAgent?.user.fullName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.admin.fullName}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(a.createdAt).toLocaleString('en-NG')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
