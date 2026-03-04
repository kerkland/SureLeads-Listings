import { Suspense } from 'react';
import ListingCard from '@/components/listings/ListingCard';
import ListingsFilterBar from '@/components/listings/ListingsFilterBar';
import { MOCK_LISTINGS } from '@/lib/mockData';

/* ─── Types ───────────────────────────────────────────── */

interface SearchProps {
  searchParams: {
    category?: string;
    city?: string;
    area?: string;
    bedrooms?: string;
    minRent?: string;
    maxRent?: string;
    propertyType?: string;
    tier?: string;
    sortBy?: string;
    page?: string;
  };
}

/* ─── Data fetch ──────────────────────────────────────── */

async function fetchListings(params: Record<string, string>) {
  try {
    const qs  = new URLSearchParams(params).toString();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/listings?${qs}`,
      { cache: 'no-store' },
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data?.length > 0) return json;
    }
  } catch { /* fall through */ }

  let listings = [...MOCK_LISTINGS];
  if (params.city)         listings = listings.filter((l) => l.city.toLowerCase().includes(params.city.toLowerCase()));
  if (params.bedrooms)     listings = listings.filter((l) => l.bedrooms >= Number(params.bedrooms));
  if (params.propertyType) listings = listings.filter((l) => l.propertyType === params.propertyType);
  if (params.tier === 'VERIFIED') listings = [];

  return { data: listings, total: listings.length, page: 1, totalPages: 1 };
}

/* ─── Helpers ─────────────────────────────────────────── */

const PT_LABEL: Record<string, string> = {
  FLAT: 'Flat', HOUSE: 'House', DUPLEX: 'Duplex',
  BUNGALOW: 'Bungalow', ROOM_SELF_CONTAIN: 'Room S/C', STUDIO: 'Studio',
};

/* ─── Page ────────────────────────────────────────────── */

export default async function ListingsPage({ searchParams }: SearchProps) {
  const params: Record<string, string> = {
    page:  searchParams.page  ?? '1',
    limit: '24',
  };
  if (searchParams.category)     params.category     = searchParams.category;
  if (searchParams.city)         params.city         = searchParams.city;
  if (searchParams.bedrooms)     params.bedrooms     = searchParams.bedrooms;
  if (searchParams.minRent)      params.minRent      = searchParams.minRent;
  if (searchParams.maxRent)      params.maxRent      = searchParams.maxRent;
  if (searchParams.propertyType) params.propertyType = searchParams.propertyType;
  if (searchParams.tier)         params.tier         = searchParams.tier;
  if (searchParams.sortBy)       params.sortBy       = searchParams.sortBy;

  const { data: listings, total, page, totalPages } = await fetchListings(params);

  const CAT_LABEL: Record<string, string> = {
    FOR_RENT: 'For Rent', FOR_SALE: 'For Sale', SHORT_LET: 'Short Let',
  };

  const chips = [
    searchParams.city         && `City: ${searchParams.city}`,
    searchParams.bedrooms     && `${searchParams.bedrooms}+ beds`,
    searchParams.propertyType && PT_LABEL[searchParams.propertyType],
    searchParams.tier === 'VERIFIED' && 'Verified only',
  ].filter(Boolean) as string[];

  const pageTitle = searchParams.city
    ? `${CAT_LABEL[searchParams.category ?? ''] ?? 'Properties'} in ${searchParams.city}`
    : searchParams.category
    ? `${CAT_LABEL[searchParams.category]} listings`
    : 'All properties';

  return (
    <div className="min-h-screen bg-white">

      {/* Filter bar */}
      <Suspense fallback={
        <div className="h-[52px] bg-white border-b border-sl-slate-200 sticky top-14 z-40" />
      }>
        <ListingsFilterBar />
      </Suspense>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Results header */}
        <div className="mb-5">
          <h1 className="text-lg font-semibold text-sl-slate-900">{pageTitle}</h1>
          <p className="text-sm text-sl-slate-500 mt-0.5">
            {total.toLocaleString()} listing{total !== 1 ? 's' : ''}
            {chips.length > 0 && (
              <span className="text-sl-slate-400"> · {chips.join(' · ')}</span>
            )}
          </p>
        </div>

        {/* Grid */}
        {listings.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-sl-slate-200 rounded-2xl">
            <div className="w-12 h-12 bg-sl-slate-100 rounded-xl flex items-center
                            justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-sl-slate-400" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-sl-slate-700 mb-1">No listings found</h3>
            <p className="text-sm text-sl-slate-400 mb-4">
              Try adjusting your filters or searching a different city.
            </p>
            <a href="/listings" className="btn-md btn-secondary">Clear all filters</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing: Parameters<typeof ListingCard>[0]) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-1.5 mt-10">
            {page > 1 && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm
                           border border-sl-slate-200 text-sl-slate-600
                           hover:border-sl-slate-300 transition-colors"
              >
                ←
              </a>
            )}
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1).map((p) => (
              <a
                key={p}
                href={`?${new URLSearchParams({ ...params, page: String(p) })}`}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm
                            font-medium transition-colors ${
                  p === page
                    ? 'bg-sl-green-500 text-white'
                    : 'border border-sl-slate-200 text-sl-slate-600 hover:border-sl-slate-300'
                }`}
              >
                {p}
              </a>
            ))}
            {page < totalPages && (
              <a
                href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-sm
                           border border-sl-slate-200 text-sl-slate-600
                           hover:border-sl-slate-300 transition-colors"
              >
                →
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
