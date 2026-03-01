'use client';

import { useEffect, useState } from 'react';
import ReconfirmationTable from '@/components/dashboard/ReconfirmationTable';

export default function ReconfirmationsPage() {
  const [listings, setListings] = useState<{
    id: string; title: string; area: string; city: string;
    status: string; nextReconfirmationDue: string | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchListings() {
    try {
      const res = await fetch('/api/listings?status=PENDING_RECONFIRMATION,HIDDEN&limit=50');
      const json = await res.json();
      if (json.success) setListings(json.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchListings(); }, []);

  function handleReconfirmed(id: string) {
    setListings((prev) => prev.filter((l) => l.id !== id));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reconfirmations</h1>
        <p className="text-gray-500 mt-1">
          Verified listings require weekly reconfirmation to stay visible.
        </p>
      </div>
      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
        </div>
      ) : (
        <ReconfirmationTable listings={listings} onReconfirmed={handleReconfirmed} />
      )}
    </div>
  );
}
