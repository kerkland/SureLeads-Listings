'use client';

import { useState } from 'react';
import type { PropertyType } from '@/types';

const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City'];
const PROPERTY_TYPES: PropertyType[] = ['FLAT', 'DUPLEX', 'ROOM', 'BUNGALOW', 'TERRACED'];

function formatNaira(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 });
}

export default function PriceInsightsPage() {
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [bedrooms, setBedrooms] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!city || !area || !propertyType) return;
    setLoading(true);
    setError('');
    setResult(null);

    const params = new URLSearchParams({ city, area, propertyType, bedrooms: bedrooms || '-1' });
    try {
      const res = await fetch('/api/price-insights?' + params.toString());
      if (res.status === 401) { setError('Please sign in to view price insights.'); return; }
      const json = await res.json();
      if (json.success) setResult(json.data);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Area Price Insights</h1>
        <p className="text-gray-500 mb-8">
          Rental price data from verified, recently-confirmed listings only.
        </p>

        <form onSubmit={search} className="bg-white rounded-2xl border p-6 space-y-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select value={city} onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600">
                <option value="">Select city</option>
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Lekki Phase 1"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600">
                <option value="">Any type</option>
                {PROPERTY_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
              <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600">
                <option value="">Any</option>
                {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} bed</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button type="submit" disabled={loading || !city || !area || !propertyType}
            className="w-full rounded-lg bg-green-600 text-white font-semibold py-3 hover:bg-green-700 disabled:opacity-50 transition">
            {loading ? 'Searching...' : 'Get Price Insights'}
          </button>
        </form>

        {result && (result as {available: boolean}).available && (
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">{result.area as string}</h2>
              <span className="text-xs text-gray-400">{result.listingCount as number} verified listings</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: 'P25', value: result.p25RentPerYear as number },
                { label: 'Median', value: result.medianRentPerYear as number, highlight: true },
                { label: 'P75', value: result.p75RentPerYear as number },
              ].map(({ label, value, highlight }) => (
                <div key={label} className={'rounded-xl p-4 ' + (highlight ? 'bg-green-50 border-2 border-green-400' : 'bg-gray-50 border')}>
                  <div className="text-xs text-gray-500 mb-1">{label}</div>
                  <div className={'font-bold ' + (highlight ? 'text-green-700 text-xl' : 'text-gray-800 text-lg')}>
                    {formatNaira(value)}
                    <span className="text-xs font-normal text-gray-400">/yr</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 text-center">
              Based on {result.listingCount as number} verified active listings.
              Confidence: {Math.round((result.confidenceScore as number) * 100)}%
            </p>
          </div>
        )}

        {result && !(result as {available: boolean}).available && (
          <div className="bg-white rounded-2xl border p-6 text-center text-gray-500">
            <p className="text-lg mb-1">Not enough data yet</p>
            <p className="text-sm">We need at least 5 verified listings in this area to publish price insights.</p>
          </div>
        )}
      </div>
    </div>
  );
}
