import FilterSidebar from '@/components/listings/FilterSidebar';
import ListingCard from '@/components/listings/ListingCard';
import { MOCK_LISTINGS } from '@/lib/mockData';
import { Suspense } from 'react';

interface SearchProps {
  searchParams: {
    city?: string;
    bedrooms?: string;
    minRent?: string;
    maxRent?: string;
    propertyType?: string;
    page?: string;
  };
}

async function fetchListings(params: Record<string, string>) {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/listings?${qs}`,
      { cache: 'no-store' }
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data?.length > 0) return json;
    }
  } catch {
    // DB not available — fall through to mock data
  }

  // Fall back to mock data, applying basic client-side filters
  let listings = [...MOCK_LISTINGS];
  if (params.city) {
    listings = listings.filter((l) =>
      l.city.toLowerCase().includes(params.city.toLowerCase())
    );
  }
  if (params.bedrooms) {
    listings = listings.filter((l) => l.bedrooms >= Number(params.bedrooms));
  }
  if (params.propertyType) {
    listings = listings.filter((l) => l.propertyType === params.propertyType);
  }
  return { data: listings, total: listings.length, page: 1, totalPages: 1 };
}

export default async function ListingsPage({ searchParams }: SearchProps) {
  const params: Record<string, string> = {
    page: searchParams.page ?? '1',
    limit: '20',
  };
  if (searchParams.city) params.city = searchParams.city;
  if (searchParams.bedrooms) params.bedrooms = searchParams.bedrooms;
  if (searchParams.minRent) params.minRent = searchParams.minRent;
  if (searchParams.maxRent) params.maxRent = searchParams.maxRent;
  if (searchParams.propertyType) params.propertyType = searchParams.propertyType;

  const { data: listings, total, page, totalPages } = await fetchListings(params);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {searchParams.city ? `Properties in ${searchParams.city}` : 'All Properties'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">{total} listing{total !== 1 ? 's' : ''} found</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <div className="lg:w-64 flex-shrink-0">
          <Suspense>
            <FilterSidebar />
          </Suspense>
        </div>

        {/* Grid */}
        <div className="flex-1">
          {listings.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No listings found</h3>
              <p className="text-gray-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {listings.map((listing: Parameters<typeof ListingCard>[0]) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <a
                  key={p}
                  href={`?${new URLSearchParams({ ...params, page: String(p) })}`}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-brand text-white'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-brand hover:text-brand'
                  }`}
                >
                  {p}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
