'use client';

import { useEffect, useState } from 'react';

interface Walkthrough {
  id: string;
  cloudinaryUrl: string;
  status: string;
  uploadedAt: string;
  listing: { id: string; title: string; area: string; city: string; agent: { fullName: string } };
}

export default function VideoWalkthroughsPage() {
  const [items, setItems] = useState<Walkthrough[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/video-walkthroughs?status=PENDING_REVIEW')
      .then(r => r.json())
      .then(j => { if (j.success) setItems(j.data); })
      .finally(() => setLoading(false));
  }, []);

  async function action(id: string, act: 'APPROVE' | 'REJECT', reason?: string) {
    setProcessing(id);
    await fetch(`/api/admin/video-walkthroughs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: act, reason }),
    });
    setItems(prev => prev.filter(i => i.id !== id));
    setProcessing(null);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Video Walkthroughs</h1>
      {loading ? <p className="text-gray-500">Loading...</p> : items.length === 0 ? (
        <div className="rounded-xl bg-green-50 border border-green-200 p-8 text-center text-green-700">
          All caught up — no pending reviews!
        </div>
      ) : (
        <div className="space-y-6">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border p-6">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900">{item.listing.title}</h3>
                <p className="text-sm text-gray-500">{item.listing.area}, {item.listing.city} — {item.listing.agent.fullName}</p>
              </div>
              <video controls className="w-full rounded-lg mb-4 max-h-80" src={item.cloudinaryUrl}>
                Video not supported
              </video>
              <div className="flex gap-3">
                <button onClick={() => action(item.id, 'APPROVE')} disabled={processing === item.id}
                  className="flex-1 rounded-lg bg-green-600 text-white font-medium py-2.5 hover:bg-green-700 disabled:opacity-50">
                  Approve
                </button>
                <button onClick={() => {
                  const reason = window.prompt('Reason for rejection:');
                  if (reason) action(item.id, 'REJECT', reason);
                }} disabled={processing === item.id}
                  className="flex-1 rounded-lg bg-red-600 text-white font-medium py-2.5 hover:bg-red-700 disabled:opacity-50">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
