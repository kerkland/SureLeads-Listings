'use client';

import { useEffect, useState } from 'react';
import CredibilityBreakdownPanel from '@/components/dashboard/CredibilityBreakdown';
import type { CredibilityBreakdown } from '@/types';

export default function CredibilityPage() {
  const [data, setData] = useState<{ breakdown: CredibilityBreakdown } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agent-profile/me')
      .then((r) => r.json())
      .then((json) => { if (json.success) setData(json.data); })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Credibility Score</h1>
      <p className="text-gray-500 mb-8">Your credibility score is publicly visible to clients.</p>
      {loading ? (
        <div className="animate-pulse bg-gray-100 rounded-2xl h-48" />
      ) : data ? (
        <div className="bg-white rounded-2xl border p-6">
          <CredibilityBreakdownPanel breakdown={data.breakdown} />
        </div>
      ) : (
        <p className="text-gray-500">Unable to load credibility data.</p>
      )}
      <div className="mt-8 rounded-xl bg-gray-50 border p-6 text-sm text-gray-600 space-y-2">
        <h2 className="font-semibold text-gray-900">How to improve your score</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Reconfirm Verified listings on time every week (25%)</li>
          <li>Respond promptly to inspection requests (20%)</li>
          <li>Earn 4-5 star reviews from clients (35%)</li>
          <li>Resolve complaints before they escalate</li>
          <li>Upgrade your subscription tier for a bonus</li>
        </ul>
      </div>
    </div>
  );
}
