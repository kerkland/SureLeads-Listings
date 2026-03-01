'use client';

import { useState } from 'react';

interface Props {
  listingId: string;
  inspectionFee: string; // kobo as string
}

export default function BookInspectionForm({ listingId, inspectionFee }: Props) {
  const [proposedDate, setProposedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const feeNaira = (Number(inspectionFee) / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/listings/${listingId}/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedDate: proposedDate || undefined, notes: notes || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Failed to book inspection');
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center">
        <div className="text-2xl mb-2">✅</div>
        <h3 className="font-semibold text-green-800 text-lg">Inspection Requested!</h3>
        <p className="text-green-700 text-sm mt-1">The agent will confirm your appointment shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred date (optional)</label>
        <input
          type="date"
          value={proposedDate}
          onChange={(e) => setProposedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Any special requirements or questions for the agent..."
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="rounded-lg bg-gray-50 border px-4 py-3 text-sm text-gray-600">
        Inspection fee: <strong className="text-gray-900">₦{feeNaira}</strong>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-green-600 text-white font-semibold py-3 hover:bg-green-700 disabled:opacity-50 transition"
      >
        {loading ? 'Submitting…' : 'Request Inspection'}
      </button>
    </form>
  );
}
