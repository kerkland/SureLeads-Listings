import Link from 'next/link';
import type { CredibilityTier } from '@/types';
import CredibilityBadge from './CredibilityBadge';
import TierBadge from './TierBadge';

/* ─── Types ──────────────────────────────────────────── */

interface ListingCardProps {
  id: string;
  title: string;
  city: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  rentPerYear: string;        // kobo as string
  inspectionFee?: string;     // kobo as string
  photos: string[];
  tier?: 'BASIC' | 'VERIFIED';
  lastReconfirmedAt?: string | null;
  isCrossPostFlagged?: boolean;
  agent: {
    fullName: string;
    agentProfile?: {
      agencyName?: string | null;
      reputationScore?: number;
      credibilityScore?: number;
      credibilityTier?: string;
      isVerifiedBadge?: boolean;
    } | null;
  };
}

/* ─── Helpers ────────────────────────────────────────── */

function formatPrice(koboStr: string): string {
  const naira = Number(koboStr) / 100;
  if (naira >= 1_000_000) return `\u20A6${(naira / 1_000_000).toFixed(1)}M`;
  if (naira >= 100_000)   return `\u20A6${Math.round(naira / 1_000)}K`;
  return `\u20A6${naira.toLocaleString('en-NG')}`;
}

function reconfirmedText(date?: string | null): string | null {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (days <= 0)  return 'Reconfirmed today';
  if (days === 1) return 'Reconfirmed 1 day ago';
  if (days <= 6)  return `Reconfirmed ${days} days ago`;
  return null;
}

const PT_LABEL: Record<string, string> = {
  FLAT: 'Flat', HOUSE: 'House', DUPLEX: 'Duplex',
  BUNGALOW: 'Bungalow', ROOM_SELF_CONTAIN: 'Room S/C',
  STUDIO: 'Studio', OFFICE: 'Office', SHOP: 'Shop',
  WAREHOUSE: 'Warehouse', LAND: 'Land',
};

/* ─── Component ──────────────────────────────────────── */

export default function ListingCard({
  id, title, city, area, bedrooms, bathrooms,
  propertyType, rentPerYear, photos,
  tier, lastReconfirmedAt, isCrossPostFlagged, agent,
}: ListingCardProps) {
  const ap        = agent.agentProfile;
  const reconfirm = reconfirmedText(lastReconfirmedAt);

  return (
    <Link href={`/listings/${id}`} className="card-hover block group">

      {/* ── Image ──────────────────────────────────────── */}
      <div className="relative h-44 bg-sl-slate-100 overflow-hidden">
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-[1.03]
                       transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-10 h-10 text-sl-slate-300" fill="none"
                 stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                    d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}

        {/* Top overlays */}
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
          {tier === 'VERIFIED' && <TierBadge tier="VERIFIED" compact />}
          {reconfirm && (
            <span className="ml-auto bg-black/55 text-white text-2xs px-2 py-1
                             rounded-md font-medium backdrop-blur-sm whitespace-nowrap">
              {reconfirm}
            </span>
          )}
        </div>

        {/* Cross-post flag */}
        {isCrossPostFlagged && (
          <span className="absolute bottom-2 left-2 bg-red-500 text-white
                           text-2xs font-medium px-2 py-0.5 rounded">
            Flagged
          </span>
        )}
      </div>

      {/* ── Content ────────────────────────────────────── */}
      <div className="p-4">

        {/* Price + type */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p className="text-base font-bold text-sl-slate-900 leading-tight">
            {formatPrice(rentPerYear)}
            <span className="text-xs font-normal text-sl-slate-400"> /yr</span>
          </p>
          <span className="text-2xs font-medium text-sl-slate-500 bg-sl-slate-100
                           px-2 py-0.5 rounded flex-shrink-0">
            {PT_LABEL[propertyType] ?? propertyType}
          </span>
        </div>

        {/* Location */}
        <p className="text-sm text-sl-slate-500 mb-2.5 leading-snug truncate">
          {area}, {city}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-3 text-xs text-sl-slate-500 mb-3">
          <span>{bedrooms} bed{bedrooms !== 1 ? 's' : ''}</span>
          <span className="text-sl-slate-300">·</span>
          <span>{bathrooms} bath{bathrooms !== 1 ? 's' : ''}</span>
        </div>

        {/* Agent row */}
        <div className="flex items-center justify-between pt-3 border-t border-sl-slate-100">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-full bg-sl-green-100 flex items-center
                            justify-center text-2xs font-bold text-sl-green-700 flex-shrink-0">
              {agent.fullName[0]}
            </div>
            <span className="text-xs text-sl-slate-600 truncate">
              {ap?.agencyName ?? agent.fullName}
            </span>
            {ap?.isVerifiedBadge && (
              <svg className="w-3.5 h-3.5 text-sl-green-500 flex-shrink-0"
                   viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {ap?.credibilityTier && ap.credibilityTier !== 'UNRATED' && (
            <CredibilityBadge
              score={ap.credibilityScore ?? 0}
              tier={ap.credibilityTier as CredibilityTier}
            />
          )}
        </div>
      </div>
    </Link>
  );
}
