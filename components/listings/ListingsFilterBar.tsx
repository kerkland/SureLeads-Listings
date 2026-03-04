'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const AREAS = [
  'Lekki Phase 1', 'Lekki Phase 2', 'Victoria Island', 'Ikoyi', 'Banana Island',
  'Ajah', 'Sangotedo', 'Chevron', 'Osapa London',
  'Ikeja GRA', 'Ikeja', 'Maryland', 'Gbagada', 'Yaba',
  'Surulere', 'Magodo', 'Ojodu', 'Ogba', 'Ketu',
];

const PROPERTY_TYPES = [
  { value: 'FLAT',              label: 'Flat'      },
  { value: 'HOUSE',             label: 'House'     },
  { value: 'DUPLEX',            label: 'Duplex'    },
  { value: 'BUNGALOW',          label: 'Bungalow'  },
  { value: 'ROOM_SELF_CONTAIN', label: 'Room S/C'  },
  { value: 'STUDIO',            label: 'Studio'    },
];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first'         },
  { value: 'price_asc',  label: 'Price: low to high'   },
  { value: 'price_desc', label: 'Price: high to low'   },
  { value: 'credibility',label: 'Top agents first'     },
];

const CATEGORIES = [
  { value: '',          label: 'All'       },
  { value: 'FOR_RENT',  label: 'For Rent'  },
  { value: 'FOR_SALE',  label: 'For Sale'  },
  { value: 'SHORT_LET', label: 'Short Let' },
];

const SELECT_CLS =
  'text-sm border border-sl-slate-200 rounded-lg px-3 py-2 bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-sl-green-500 text-sl-slate-700 ' +
  'cursor-pointer transition-colors hover:border-sl-slate-300';

export default function ListingsFilterBar() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else       params.delete(key);
      params.delete('page'); // reset to page 1 on filter change
      router.push(`/listings?${params.toString()}`);
    },
    [router, searchParams],
  );

  const category     = searchParams.get('category')     ?? '';
  const area         = searchParams.get('area')         ?? '';
  const bedrooms     = searchParams.get('bedrooms')     ?? '';
  const propertyType = searchParams.get('propertyType') ?? '';
  const tier         = searchParams.get('tier')         ?? '';
  const sortBy       = searchParams.get('sortBy')       ?? 'newest';

  const hasFilters = !!(area || bedrooms || propertyType || tier);

  return (
    <div className="bg-white border-b border-sl-slate-200 sticky top-14 z-40">
      {/* Category tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-sl-slate-100">
        <div className="flex gap-0 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => {
            const active = category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => update('category', cat.value)}
                className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  active
                    ? 'text-sl-slate-900 border-sl-green-500'
                    : 'text-sl-slate-500 border-transparent hover:text-sl-slate-700 hover:border-sl-slate-300'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">

          {/* Area */}
          <select
            value={area}
            onChange={(e) => update('area', e.target.value)}
            className={SELECT_CLS}
            aria-label="Filter by area"
          >
            <option value="">All areas</option>
            {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>

          {/* Bedrooms */}
          <select
            value={bedrooms}
            onChange={(e) => update('bedrooms', e.target.value)}
            className={SELECT_CLS}
            aria-label="Filter by bedrooms"
          >
            <option value="">Any beds</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}{n === 4 ? '+' : ''} bed{n !== 1 ? 's' : ''}</option>
            ))}
          </select>

          {/* Property type */}
          <select
            value={propertyType}
            onChange={(e) => update('propertyType', e.target.value)}
            className={SELECT_CLS}
            aria-label="Filter by property type"
          >
            <option value="">All types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>

          {/* Verified only toggle */}
          <button
            onClick={() => update('tier', tier === 'VERIFIED' ? '' : 'VERIFIED')}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border
                        transition-colors whitespace-nowrap cursor-pointer ${
              tier === 'VERIFIED'
                ? 'bg-sl-green-50 border-sl-green-300 text-sl-green-700 font-medium'
                : 'border-sl-slate-200 text-sl-slate-700 hover:border-sl-slate-300'
            }`}
            aria-pressed={tier === 'VERIFIED'}
          >
            <svg className={`w-3.5 h-3.5 ${tier === 'VERIFIED' ? 'text-sl-green-600' : 'text-sl-slate-400'}`}
                 viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Verified only
          </button>

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={() => router.push('/listings')}
              className="text-sm text-sl-slate-500 hover:text-sl-slate-800
                         underline underline-offset-2 whitespace-nowrap transition-colors"
            >
              Clear filters
            </button>
          )}

          {/* Sort — pushed to right */}
          <div className="ml-auto flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => update('sortBy', e.target.value)}
              className={SELECT_CLS}
              aria-label="Sort listings"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

