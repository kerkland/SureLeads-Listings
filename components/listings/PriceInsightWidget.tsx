'use client';

import { useEffect, useState } from 'react';
import type { PropertyType, PriceInsightResponse } from '@/types';

interface Props {
  city: string;
  area: string;
  propertyType: PropertyType;
  bedrooms: number;
  currentRent: number; // in kobo
}

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function PriceInsightWidget({ city, area, propertyType, bedrooms, currentRent }: Props) {
  const [data, setData] = useState<PriceInsightResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(true);

  useEffect(() => {
    const url = `/api/price-insights?city=${encodeURIComponent(city)}&area=${encodeURIComponent(area)}&propertyType=${propertyType}&bedrooms=${bedrooms}`;
    fetch(url)
      .then(async (res) => {
        if (res.status === 401) { setAuthed(false); return; }
        const json = await res.json();
        setData(json.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [city, area, propertyType, bedrooms]);

  if (loading) return (
    <div className="rounded-xl bg-gray-50 border p-4 animate-pulse h-20" />
  );

  if (!authed) return (
    <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
      <a href="/login" className="font-semibold underline">Sign in</a> to see area price insights for {area}.
    </div>
  );

  if (!data || !data.available) return null;

  const pct = data.available ? Math.round((currentRent / data.medianRentPerYear) * 100) : null;
  const vsMedian = pct ? (pct > 100 ? `+${pct - 100}% above` : `${100 - pct}% below`) : null;

  return (
    <div className="rounded-xl bg-gray-50 border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">
          Area Price Insights · {data.available && 'isFallback' in data && (data as {isFallback:boolean}).isFallback ? 'City average' : area}
        </h4>
        <span className="text-xs text-gray-400">
          Based on {data.listingCount} verified listing{data.listingCount !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center text-xs">
        <div>
          <div className="text-gray-500">P25</div>
          <div className="font-semibold text-gray-800">{formatNaira(data.p25RentPerYear)}</div>
        </div>
        <div className="border-x px-2">
          <div className="text-gray-500">Median</div>
          <div className="font-bold text-gray-900 text-sm">{formatNaira(data.medianRentPerYear)}</div>
        </div>
        <div>
          <div className="text-gray-500">P75</div>
          <div className="font-semibold text-gray-800">{formatNaira(data.p75RentPerYear)}</div>
        </div>
      </div>

      {vsMedian && (
        <p className="text-xs text-gray-500">
          This listing is priced <strong className={pct! > 100 ? 'text-red-600' : 'text-green-600'}>{vsMedian}</strong> the area median.
        </p>
      )}
    </div>
  );
}
