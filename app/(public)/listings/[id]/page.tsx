import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookInspection from './BookInspection';
import { MOCK_LISTINGS } from '@/lib/mockData';

interface Props {
  params: { id: string };
}

async function fetchListing(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/listings/${id}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch {
    // DB not available — fall through to mock data
  }

  // Fall back to mock data (works for preview without a DB)
  const mock = MOCK_LISTINGS.find((l) => l.id === id) ?? MOCK_LISTINGS[0];
  return mock;
}

function formatNaira(koboStr: string) {
  return `₦${(Number(koboStr) / 100).toLocaleString('en-NG')}`;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'text-accent' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.286 3.966c.3.921-.755 1.688-1.54 1.118L10 14.347l-3.352 2.704c-.785.57-1.84-.197-1.54-1.118l1.286-3.966a1 1 0 00-.364-1.118L2.65 9.394c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ))}
    </div>
  );
}

export default async function ListingDetailPage({ params }: Props) {
  const listing = await fetchListing(params.id);
  if (!listing) notFound();

  const agent = listing.agent;
  const agentProfile = agent?.agentProfile;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link href="/listings" className="text-sm text-brand hover:underline mb-6 inline-flex items-center gap-1">
        ← Back to listings
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        {/* Left column */}
        <div className="lg:col-span-2">
          {/* Photo gallery */}
          <div className="rounded-2xl overflow-hidden bg-gray-200 mb-6">
            {listing.photos?.length > 0 ? (
              <div className="grid grid-cols-2 gap-1">
                {listing.photos.slice(0, 4).map((photo: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={photo}
                    alt={`${listing.title} photo ${i + 1}`}
                    className={`object-cover w-full ${i === 0 ? 'h-64 col-span-2' : 'h-32'}`}
                  />
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">No photos</div>
            )}
          </div>

          {/* Listing details */}
          <div className="card p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{listing.title}</h1>
                <p className="text-gray-500">
                  {listing.area}, {listing.city}
                </p>
              </div>
              {listing.isCrossPostFlagged && (
                <span className="bg-red-100 text-red-700 text-xs font-medium px-3 py-1 rounded-full">
                  ⚠ Flagged
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
              <span className="bg-gray-100 px-3 py-1 rounded-full">{listing.propertyType}</span>
              <span>🛏 {listing.bedrooms} bedrooms</span>
              <span>🚿 {listing.bathrooms} bathrooms</span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl mb-6">
              <p className="text-xs text-gray-500 mb-1">Annual Rent</p>
              <p className="text-xl font-bold text-brand">{formatNaira(listing.rentPerYear)}</p>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{listing.description}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-brand">{listing.viewsCount ?? 0}</p>
              <p className="text-xs text-gray-500 mt-1">Views</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-brand">
                {listing.avgRating ? listing.avgRating.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Avg Rating</p>
            </div>
          </div>
        </div>

        {/* Right column — agent card + CTA */}
        <div className="space-y-4">
          {/* Agent card */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-4">About the Agent</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand font-bold text-lg">
                {agent?.fullName?.[0] ?? 'A'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{agentProfile?.agencyName ?? agent?.fullName}</p>
                <p className="text-sm text-gray-500">{agentProfile?.city}</p>
              </div>
              {agentProfile?.isVerifiedBadge && (
                <span className="ml-auto bg-brand-50 text-brand text-xs px-2 py-0.5 rounded-full font-medium">
                  ✓ Verified
                </span>
              )}
            </div>

            {agentProfile?.reputationScore !== undefined && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Reputation</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-brand h-2 rounded-full"
                      style={{ width: `${agentProfile.reputationScore / 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-brand">{agentProfile.reputationScore}/1000</span>
                </div>
              </div>
            )}

            {listing.avgRating && (
              <div className="flex items-center gap-2 mb-3">
                <StarRating rating={Math.round(listing.avgRating)} />
                <span className="text-sm text-gray-600">{listing.avgRating.toFixed(1)}</span>
              </div>
            )}

            {agentProfile?.bio && (
              <p className="text-sm text-gray-500 leading-relaxed">{agentProfile.bio}</p>
            )}
          </div>

          {/* Book Inspection CTA */}
          <BookInspection />
        </div>
      </div>
    </div>
  );
}
