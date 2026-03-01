import Link from 'next/link';
import { notFound } from 'next/navigation';
import BookInspectionForm from '@/components/BookInspectionForm';
import TierBadge from '@/components/listings/TierBadge';
import CredibilityBadge from '@/components/listings/CredibilityBadge';
import PriceInsightWidget from '@/components/listings/PriceInsightWidget';
import VideoWalkthroughPlayer from '@/components/listings/VideoWalkthroughPlayer';
import { MOCK_LISTINGS } from '@/lib/mockData';
import type { CredibilityTier, PropertyType } from '@/types';

interface Props { params: { id: string } }

async function fetchListing(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/listings/${id}`,
      { cache: 'no-store' },
    );
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch { /* fall through */ }

  return MOCK_LISTINGS.find((l) => l.id === id) ?? MOCK_LISTINGS[0];
}

function formatNaira(koboStr: string) {
  const n = Number(koboStr) / 100;
  if (n >= 1_000_000) return `\u20A6${(n / 1_000_000).toFixed(2)}M`;
  return `\u20A6${n.toLocaleString('en-NG')}`;
}

function daysAgo(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000);
  if (d <= 0)  return 'Reconfirmed today';
  if (d === 1) return 'Reconfirmed 1 day ago';
  if (d <= 7)  return `Reconfirmed ${d} days ago`;
  return null;
}

const PT_LABEL: Record<string, string> = {
  FLAT: 'Flat', HOUSE: 'House', DUPLEX: 'Duplex',
  BUNGALOW: 'Bungalow', ROOM_SELF_CONTAIN: 'Room (self-contain)',
  STUDIO: 'Studio', OFFICE: 'Office', SHOP: 'Shop',
  WAREHOUSE: 'Warehouse', LAND: 'Land',
};

export default async function ListingDetailPage({ params }: Props) {
  const listing = await fetchListing(params.id);
  if (!listing) notFound();

  const agent   = listing.agent;
  const ap      = agent?.agentProfile;
  const isVerified = listing.tier === 'VERIFIED';
  const reconfirmLabel = daysAgo(listing.lastReconfirmedAt);
  const hasVideo = listing.videoWalkthrough?.cloudinaryUrl && listing.videoWalkthrough.status === 'APPROVED';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-sm text-sl-slate-500
                   hover:text-sl-slate-900 mb-6 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All properties
      </Link>

      {/* Verified listing banner */}
      {isVerified && (
        <div className="flex items-center gap-3 bg-sl-green-50 border border-sl-green-200
                        rounded-xl px-4 py-3 mb-6">
          <svg className="w-4 h-4 text-sl-green-600 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sl-green-800">
              Verified listing
              {reconfirmLabel && (
                <span className="font-normal text-sl-green-600"> · {reconfirmLabel}</span>
              )}
            </p>
            <p className="text-xs text-sl-green-600 mt-0.5">
              Agent reconfirms availability weekly. Auto-removed if missed.
            </p>
          </div>
          <TierBadge tier="VERIFIED" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left column ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Photo gallery */}
          <div className="rounded-2xl overflow-hidden border border-sl-slate-200 bg-sl-slate-100">
            {listing.photos?.length > 0 ? (
              <div className={`grid gap-0.5 ${listing.photos.length === 1 ? '' : 'grid-cols-2'}`}>
                {listing.photos.slice(0, 4).map((photo: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={photo}
                    alt={`${listing.title} — photo ${i + 1}`}
                    className={`object-cover w-full ${
                      i === 0 ? 'h-72' + (listing.photos.length > 1 ? ' col-span-2' : '') : 'h-40'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-sl-slate-400">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Video walkthrough */}
          {hasVideo && (
            <div className="border border-sl-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-sl-slate-200 flex items-center gap-2">
                <svg className="w-4 h-4 text-sl-green-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm12.553.106A1 1 0 0014 7v6a1 1 0 00.553.894l2 1A1 1 0 0018 14V6a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                <p className="text-sm font-medium text-sl-slate-900">Video walkthrough</p>
              </div>
              <VideoWalkthroughPlayer url={listing.videoWalkthrough.cloudinaryUrl} />
            </div>
          )}

          {/* Listing details */}
          <div className="border border-sl-slate-200 rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-sl-slate-900 mb-1">{listing.title}</h1>
                <p className="text-sm text-sl-slate-500">{listing.area}, {listing.city}</p>
              </div>
              {listing.isCrossPostFlagged && (
                <span className="badge badge-red flex-shrink-0">Flagged</span>
              )}
            </div>

            {/* Quick specs */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="badge badge-slate">
                {PT_LABEL[listing.propertyType] ?? listing.propertyType}
              </span>
              <span className="badge badge-slate">{listing.bedrooms} bed{listing.bedrooms !== 1 ? 's' : ''}</span>
              <span className="badge badge-slate">{listing.bathrooms} bath{listing.bathrooms !== 1 ? 's' : ''}</span>
            </div>

            {/* Price block */}
            <div className="bg-sl-slate-50 border border-sl-slate-200 rounded-xl px-5 py-4 mb-5">
              <p className="text-xs text-sl-slate-500 mb-1">Annual rent</p>
              <p className="text-2xl font-bold text-sl-slate-900">
                {formatNaira(listing.rentPerYear)}
              </p>
            </div>

            {/* Description */}
            {listing.description && (
              <>
                <h2 className="text-sm font-semibold text-sl-slate-900 mb-2">About this property</h2>
                <p className="text-sm text-sl-slate-600 leading-relaxed">{listing.description}</p>
              </>
            )}
          </div>

          {/* Price insights widget (client-side, auth-gated) */}
          {isVerified && listing.propertyType && (
            <PriceInsightWidget
              city={listing.city}
              area={listing.area}
              propertyType={listing.propertyType as PropertyType}
              bedrooms={listing.bedrooms}
              currentRent={Number(listing.rentPerYear)}
            />
          )}
        </div>

        {/* ── Right column ──────────────────────────────────── */}
        <div className="space-y-4">

          {/* Agent card */}
          <div className="border border-sl-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-sl-slate-900 mb-4">Agent</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-sl-green-100 flex items-center
                              justify-center text-sl-green-700 font-bold text-base flex-shrink-0">
                {agent?.fullName?.[0] ?? 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sl-slate-900 truncate">
                  {ap?.agencyName ?? agent?.fullName}
                </p>
                {ap?.isVerifiedBadge && (
                  <span className="badge badge-green mt-0.5">
                    <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified agent
                  </span>
                )}
              </div>
            </div>

            {/* Credibility score */}
            {ap?.credibilityScore !== undefined && ap.credibilityTier && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-sl-slate-500">Credibility score</span>
                  <CredibilityBadge
                    score={ap.credibilityScore}
                    tier={ap.credibilityTier as CredibilityTier}
                  />
                </div>
                <div className="h-1.5 bg-sl-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sl-green-500 rounded-full"
                    style={{ width: `${Math.min(100, ap.credibilityScore / 10)}%` }}
                  />
                </div>
                <p className="text-2xs text-sl-slate-400 mt-1">{ap.credibilityScore} / 1000</p>
              </div>
            )}

            {/* Agent stats */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {listing.reviewCount > 0 && (
                <div className="bg-sl-slate-50 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-base font-bold text-sl-slate-900">{listing.reviewCount}</p>
                  <p className="text-2xs text-sl-slate-500">Reviews</p>
                </div>
              )}
              {listing.avgRating > 0 && (
                <div className="bg-sl-slate-50 rounded-lg px-3 py-2.5 text-center">
                  <p className="text-base font-bold text-sl-slate-900">
                    {listing.avgRating?.toFixed(1)}
                  </p>
                  <p className="text-2xs text-sl-slate-500">Avg rating</p>
                </div>
              )}
            </div>

            {/* Bio */}
            {ap?.bio && (
              <p className="text-xs text-sl-slate-500 leading-relaxed mb-3">{ap.bio}</p>
            )}

            {/* View profile */}
            {agent?.id && (
              <Link
                href={`/agents/${agent.id}`}
                className="text-xs text-sl-green-600 hover:text-sl-green-700
                           hover:underline font-medium transition-colors"
              >
                View full profile →
              </Link>
            )}
          </div>

          {/* Inspection form */}
          <div className="border border-sl-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-sl-slate-900 mb-1">Request an inspection</h3>
            <p className="text-xs text-sl-slate-500 mb-4">
              The agent will confirm your appointment. No payment required to request.
            </p>
            <BookInspectionForm
              listingId={listing.id}
              inspectionFee={listing.inspectionFee ?? '0'}
            />
          </div>

          {/* Listing meta */}
          <div className="border border-sl-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-sl-slate-900">Listing info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-sl-slate-500">Status</span>
                <span className="font-medium text-sl-slate-900 capitalize">
                  {listing.status?.toLowerCase().replace('_', ' ') ?? 'Available'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sl-slate-500">Tier</span>
                <span className="font-medium text-sl-slate-900">
                  {listing.tier === 'VERIFIED' ? 'Verified' : 'Basic'}
                </span>
              </div>
              {listing.viewsCount !== undefined && (
                <div className="flex justify-between">
                  <span className="text-sl-slate-500">Views</span>
                  <span className="font-medium text-sl-slate-900">
                    {listing.viewsCount.toLocaleString()}
                  </span>
                </div>
              )}
              {listing.createdAt && (
                <div className="flex justify-between">
                  <span className="text-sl-slate-500">Listed</span>
                  <span className="font-medium text-sl-slate-900">
                    {new Date(listing.createdAt).toLocaleDateString('en-NG', {
                      month: 'short', year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
