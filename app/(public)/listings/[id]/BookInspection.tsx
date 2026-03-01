'use client';

import { useState } from 'react';

export default function BookInspection() {
  const [showToast, setShowToast] = useState(false);

  function handleClick() {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  }

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-900 mb-2">Book an Inspection</h3>
      <p className="text-sm text-gray-500 mb-4">
        Contact the agent to arrange a viewing. Secure escrow payments are coming soon.
      </p>
      <button
        onClick={handleClick}
        className="btn-primary w-full text-center py-3"
      >
        Book Inspection
      </button>
      <p className="text-xs text-gray-400 text-center mt-3">
        Secure inspection fee payments — coming in Phase 2.
      </p>

      {showToast && (
        <div className="mt-4 bg-amber-50 border border-amber-300 text-amber-800 text-sm rounded-lg px-4 py-3">
          Inspection fee payments are coming soon. Please contact the agent directly to arrange a viewing for now.
        </div>
      )}
    </div>
  );
}
