'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const PROPERTY_TYPES = ['FLAT', 'DUPLEX', 'ROOM', 'BUNGALOW', 'TERRACED'];
const CITIES = ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City'];

export default function FilterSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [city, setCity] = useState(searchParams.get('city') ?? '');
  const [bedrooms, setBedrooms] = useState(searchParams.get('bedrooms') ?? '');
  const [minRent, setMinRent] = useState(searchParams.get('minRent') ?? '');
  const [maxRent, setMaxRent] = useState(searchParams.get('maxRent') ?? '');
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') ?? '');

  function applyFilters() {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (bedrooms) params.set('bedrooms', bedrooms);
    if (minRent) params.set('minRent', (Number(minRent) * 100).toString()); // convert to kobo
    if (maxRent) params.set('maxRent', (Number(maxRent) * 100).toString());
    if (propertyType) params.set('propertyType', propertyType);
    router.push(`/listings?${params.toString()}`);
  }

  function clearFilters() {
    setCity('');
    setBedrooms('');
    setMinRent('');
    setMaxRent('');
    setPropertyType('');
    router.push('/listings');
  }

  return (
    <aside className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
      <h2 className="font-semibold text-gray-900 mb-4">Filter Properties</h2>

      {/* City */}
      <div className="mb-4">
        <label className="label">City</label>
        <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All cities</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Property Type */}
      <div className="mb-4">
        <label className="label">Property Type</label>
        <select className="input" value={propertyType} onChange={(e) => setPropertyType(e.target.value)}>
          <option value="">All types</option>
          {PROPERTY_TYPES.map((t) => (
            <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>
          ))}
        </select>
      </div>

      {/* Bedrooms */}
      <div className="mb-4">
        <label className="label">Bedrooms</label>
        <select className="input" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}+</option>
          ))}
        </select>
      </div>

      {/* Rent range */}
      <div className="mb-4">
        <label className="label">Annual Rent (₦)</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            className="input"
            value={minRent}
            onChange={(e) => setMinRent(e.target.value)}
          />
          <input
            type="number"
            placeholder="Max"
            className="input"
            value={maxRent}
            onChange={(e) => setMaxRent(e.target.value)}
          />
        </div>
      </div>

      <button onClick={applyFilters} className="btn-primary w-full mb-2 text-sm py-2.5">
        Apply Filters
      </button>
      <button onClick={clearFilters} className="w-full text-sm text-gray-500 hover:text-gray-700 py-2">
        Clear all
      </button>
    </aside>
  );
}
