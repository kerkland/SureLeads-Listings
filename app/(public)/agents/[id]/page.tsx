import Link from 'next/link';
import { notFound } from 'next/navigation';
import CredibilityBadge from '@/components/listings/CredibilityBadge';
import CredibilityBreakdownPanel from '@/components/dashboard/CredibilityBreakdown';
import ListingCard from '@/components/listings/ListingCard';
import type { CredibilityBreakdown, CredibilityTier } from '@/types';

interface Props { params: { id: string } }

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Review {
  id: string;
  rating: number;
  body?: string | null;
  createdAt: string;
  reviewer: { fullName: string };
}

interface ActiveListing {
  id: string;
  title: string;
  city: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  rentPerYear: string;
  photos: string[];
  tier: 'BASIC' | 'VERIFIED';
  lastReconfirmedAt: string | null;
}

interface AgentData {
  id: string;
  fullName: string;
  agencyName: string | null;
  primaryCity: string;
  servedCities: string[];
  bio: string | null;
  profilePhoto: string | null;
  isVerifiedBadge: boolean;
  subscriptionTier: 'STARTER' | 'PROFESSIONAL' | 'AGENCY';
  credibilityScore: number;
  credibilityTier: CredibilityTier;
  credibilityBreakdown: CredibilityBreakdown;
  memberSince: string;
  reviewCount: number;
  completedInspections: number;
  totalActiveListings: number;
  recentReviews: Review[];
  activeListings: ActiveListing[];
}

/* ─── Fetch ──────────────────────────────────────────────────────────────── */

async function getAgent(id: string): Promise<AgentData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/agents/${id}/profile`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const SUB_TIER: Record<string, { label: string; cls: string }> = {
  AGENCY:       { label: 'Agency',       cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  PROFESSIONAL: { label: 'Professional', cls: 'bg-sl-green-50 text-sl-green-700 border-sl-green-200' },
  STARTER:      { label: 'Starter',      cls: 'bg-sl-slate-100 text-sl-slate-500 border-sl-slate-200' },
};

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? 'text-sl-gold-500' : 'text-sl-slate-200'}>★</span>
      ))}
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default async function AgentProfilePage({ params }: Props) {
  const agent = await getAgent(params.id);
  if (!agent) notFound();

  const subTierConfig = SUB_TIER[agent.subscriptionTier] ?? SUB_TIER.STARTER;
  const avgRating     = agent.recentReviews.length > 0
    ? (agent.recentReviews.reduce((s, r) => s + r.rating, 0) / agent.recentReviews.length).toFixed(1)
    : null;

  /* Agent prop reused on every ListingCard */
  const cardAgent = {
    fullName: agent.fullName,
    agentProfile: {
      agencyName:       agent.agencyName,
      profilePhoto:     agent.profilePhoto,
      credibilityScore: agent.credibilityScore,
      credibilityTier:  agent.credibilityTier,
      isVerifiedBadge:  agent.isVerifiedBadge,
    },
  };

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
        Browse listings
      </Link>

      {/* ── Hero Card ──────────────────────────────────────────────────────── */}
      <div className="bg-white border border-sl-slate-200 rounded-2xl p-6 mb-8">
        <div className="flex items-start gap-5">

          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-sl-green-100 flex-shrink-0 overflow-hidden">
            {agent.profilePhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={agent.profilePhoto}
                alt={agent.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center
                              text-3xl font-bold text-sl-green-600">
                {agent.fullName[0]}
              </div>
            )}
          </div>

          {/* Name + badges + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-sl-slate-900">{agent.fullName}</h1>
              {agent.isVerifiedBadge && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold
                                 px-2.5 py-0.5 rounded-full bg-sl-green-50 text-sl-green-700
                                 border border-sl-green-200">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${subTierConfig.cls}`}>
                {subTierConfig.label}
              </span>
            </div>

            {agent.agencyName && (
              <p className="text-sm font-medium text-sl-slate-700 mb-0.5">{agent.agencyName}</p>
            )}
            <div className="flex items-center gap-1 mb-3">
              <svg className="w-3.5 h-3.5 text-sl-slate-400 flex-shrink-0" fill="none"
                   stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <p className="text-sm text-sl-slate-500">{agent.primaryCity}</p>
            </div>

            <CredibilityBadge
              score={agent.credibilityScore}
              tier={agent.credibilityTier}
              showScore
            />
          </div>

          {/* Avg rating — desktop top-right */}
          {avgRating && (
            <div className="hidden sm:flex flex-col items-end gap-0.5 flex-shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-sl-slate-900">{avgRating}</span>
                <span className="text-sl-gold-500 text-lg">★</span>
              </div>
              <p className="text-xs text-sl-slate-400">avg rating</p>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="mt-5 pt-4 border-t border-sl-slate-100 flex flex-wrap gap-x-6 gap-y-2">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-sl-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="text-sm font-semibold text-sl-slate-900">{agent.totalActiveListings}</span>
            <span className="text-sm text-sl-slate-500">active listing{agent.totalActiveListings !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-sl-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            <span className="text-sm font-semibold text-sl-slate-900">{agent.reviewCount}</span>
            <span className="text-sm text-sl-slate-500">review{agent.reviewCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-sl-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-semibold text-sl-slate-900">{agent.completedInspections}</span>
            <span className="text-sm text-sl-slate-500">inspection{agent.completedInspections !== 1 ? 's' : ''}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-sl-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-sl-slate-900">
              Since {new Date(agent.memberSince).getFullYear()}
            </span>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left: main content ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Bio */}
          {agent.bio && (
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
              <h2 className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-3">
                About
              </h2>
              <p className="text-sm text-sl-slate-600 leading-relaxed">{agent.bio}</p>
            </div>
          )}

          {/* Active listings */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-sl-slate-900">
                Active listings
                {agent.totalActiveListings > 0 && (
                  <span className="ml-2 text-sm font-normal text-sl-slate-400">
                    ({agent.totalActiveListings})
                  </span>
                )}
              </h2>
              {agent.totalActiveListings > 6 && (
                <Link
                  href={`/listings?agentId=${agent.id}`}
                  className="text-xs font-medium text-sl-green-600 hover:text-sl-green-700
                             hover:underline transition-colors"
                >
                  View all {agent.totalActiveListings} →
                </Link>
              )}
            </div>

            {agent.activeListings.length === 0 ? (
              <div className="bg-white border border-sl-slate-200 rounded-2xl p-10 text-center">
                <div className="w-12 h-12 bg-sl-slate-100 rounded-xl flex items-center
                                justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-sl-slate-400" fill="none"
                       stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-sl-slate-700 mb-1">No active listings</p>
                <p className="text-xs text-sl-slate-400">
                  This agent has no available properties at the moment.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {agent.activeListings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    title={listing.title}
                    city={listing.city}
                    area={listing.area}
                    bedrooms={listing.bedrooms}
                    bathrooms={listing.bathrooms}
                    propertyType={listing.propertyType}
                    rentPerYear={listing.rentPerYear}
                    photos={listing.photos}
                    tier={listing.tier}
                    lastReconfirmedAt={listing.lastReconfirmedAt}
                    agent={cardAgent}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Credibility Breakdown */}
          <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
            <h2 className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-5">
              Credibility score
            </h2>
            <CredibilityBreakdownPanel breakdown={agent.credibilityBreakdown} />
          </div>

          {/* Reviews */}
          <div className="bg-white border border-sl-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest">
                Reviews
                {agent.reviewCount > 0 && (
                  <span className="ml-2 font-normal normal-case tracking-normal text-sl-slate-400">
                    ({agent.reviewCount})
                  </span>
                )}
              </h2>
              {avgRating && (
                <div className="flex items-center gap-1.5">
                  <Stars rating={Math.round(Number(avgRating))} />
                  <span className="text-sm font-bold text-sl-slate-900">{avgRating}</span>
                </div>
              )}
            </div>

            {agent.recentReviews.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-sl-slate-400">No reviews yet.</p>
                <p className="text-xs text-sl-slate-300 mt-1">
                  Reviews are left by clients after completed inspections.
                </p>
              </div>
            ) : (
              <div className="space-y-5 divide-y divide-sl-slate-50">
                {agent.recentReviews.map((r) => (
                  <div key={r.id} className="flex gap-3 pt-5 first:pt-0">
                    <div className="w-9 h-9 rounded-full bg-sl-slate-100 flex items-center
                                    justify-center text-xs font-bold text-sl-slate-600 flex-shrink-0">
                      {r.reviewer.fullName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-semibold text-sl-slate-900">
                          {r.reviewer.fullName}
                        </span>
                        <Stars rating={r.rating} />
                      </div>
                      {r.body && (
                        <p className="text-sm text-sl-slate-600 leading-relaxed mt-1">{r.body}</p>
                      )}
                      <p className="text-xs text-sl-slate-400 mt-1.5">
                        {new Date(r.createdAt).toLocaleDateString('en-NG', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Right sidebar ──────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* CTA */}
          <div className="bg-white border border-sl-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold text-sl-green-500 uppercase tracking-widest mb-1">
              Work with this agent
            </p>
            <h3 className="text-base font-bold text-sl-slate-900 mb-1">
              {agent.agencyName ?? agent.fullName}
            </h3>
            <p className="text-xs text-sl-slate-500 mb-4 leading-relaxed">
              Browse their properties and request an inspection on any listing you like.
            </p>
            <Link
              href={`/listings?agentId=${agent.id}`}
              className="flex items-center justify-center gap-2 w-full rounded-xl
                         bg-sl-green-600 hover:bg-sl-green-700 text-white
                         text-sm font-semibold py-3 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              View {agent.totalActiveListings > 0 ? agent.totalActiveListings : 'all'}{' '}
              propert{agent.totalActiveListings !== 1 ? 'ies' : 'y'}
            </Link>
          </div>

          {/* Credibility mini-card */}
          <div className="bg-white border border-sl-slate-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest">
                Credibility
              </h3>
              <CredibilityBadge score={agent.credibilityScore} tier={agent.credibilityTier} />
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-bold text-sl-slate-900">{agent.credibilityScore}</span>
              <span className="text-sm text-sl-slate-400 mb-1">/ 1000</span>
            </div>
            <div className="h-2 bg-sl-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sl-green-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, agent.credibilityScore / 10)}%` }}
              />
            </div>
            <p className="text-xs text-sl-slate-400 mt-2">
              Based on reviews, reconfirmations, and inspection response rate.
            </p>
          </div>

          {/* Areas served */}
          {agent.servedCities && agent.servedCities.length > 0 && (
            <div className="bg-white border border-sl-slate-200 rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-sl-slate-500 uppercase tracking-widest mb-3">
                Areas served
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {agent.servedCities.map((city: string) => (
                  <span
                    key={city}
                    className="text-xs px-2.5 py-1 rounded-full bg-sl-slate-100
                               text-sl-slate-600 border border-sl-slate-200"
                  >
                    {city}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trust & Safety */}
          <div className="bg-sl-green-50 border border-sl-green-100 rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-sl-green-700 uppercase tracking-widest mb-4">
              SureLeads Trust
            </h3>
            <div className="space-y-3">
              {agent.isVerifiedBadge && (
                <div className="flex items-start gap-2.5">
                  <svg className="w-4 h-4 text-sl-green-600 mt-0.5 flex-shrink-0"
                       viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs text-sl-green-700 leading-relaxed">
                    <span className="font-semibold">Identity verified</span> — CAC number and
                    credentials reviewed by SureLeads.
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-sl-green-600 mt-0.5 flex-shrink-0"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-sl-green-700 leading-relaxed">
                  <span className="font-semibold">Weekly reconfirmations</span> — listings
                  confirmed available every 7 days, auto-removed if missed.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <svg className="w-4 h-4 text-sl-green-600 mt-0.5 flex-shrink-0"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-sl-green-700 leading-relaxed">
                  <span className="font-semibold">Free to inspect</span> — no payment needed
                  to book a viewing. Pay only when you decide to rent.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
