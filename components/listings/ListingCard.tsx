import Link from 'next/link';

interface ListingCardProps {
  id: string;
  title: string;
  city: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  rentPerYear: string; // kobo as string
  inspectionFee: string; // kobo as string
  photos: string[];
  isCrossPostFlagged?: boolean;
  agent: {
    fullName: string;
    agentProfile?: {
      agencyName?: string;
      reputationScore?: number;
      isVerifiedBadge?: boolean;
    } | null;
  };
}

function formatNaira(koboStr: string): string {
  const naira = Number(koboStr) / 100;
  return `₦${naira.toLocaleString('en-NG')}`;
}

function reputationLabel(score: number): { label: string; color: string } {
  if (score >= 800) return { label: 'Excellent', color: 'text-green-600 bg-green-50' };
  if (score >= 600) return { label: 'Good', color: 'text-blue-600 bg-blue-50' };
  if (score >= 400) return { label: 'Fair', color: 'text-yellow-600 bg-yellow-50' };
  return { label: 'New', color: 'text-gray-600 bg-gray-100' };
}

export default function ListingCard({
  id,
  title,
  city,
  area,
  bedrooms,
  bathrooms,
  propertyType,
  rentPerYear,
  inspectionFee,
  photos,
  isCrossPostFlagged,
  agent,
}: ListingCardProps) {
  const rep = agent.agentProfile?.reputationScore
    ? reputationLabel(agent.agentProfile.reputationScore)
    : null;

  return (
    <Link href={`/listings/${id}`} className="card group hover:shadow-md transition-shadow block">
      {/* Photo */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photos[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </div>
        )}

        {/* Property type badge */}
        <span className="absolute top-3 left-3 bg-white text-gray-700 text-xs font-medium px-2 py-1 rounded-full shadow-sm">
          {propertyType}
        </span>

        {/* Cross-post warning */}
        {isCrossPostFlagged && (
          <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-medium px-2 py-1 rounded-full">
            ⚠ Flagged
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-brand transition-colors">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-3">
          {area}, {city}
        </p>

        <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
          <span>🛏 {bedrooms} bed</span>
          <span>🚿 {bathrooms} bath</span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-brand">{formatNaira(rentPerYear)}</p>
            <p className="text-xs text-gray-400">per year</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Inspection fee</p>
            <p className="text-sm font-semibold text-accent">{formatNaira(inspectionFee)}</p>
          </div>
        </div>

        {/* Agent badge */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-xs font-semibold text-brand">
              {agent.fullName[0]}
            </div>
            <span className="text-xs text-gray-600 truncate max-w-[120px]">
              {agent.agentProfile?.agencyName ?? agent.fullName}
            </span>
            {agent.agentProfile?.isVerifiedBadge && (
              <span title="Verified Agent" className="text-brand text-xs">✓</span>
            )}
          </div>
          {rep && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rep.color}`}>
              {rep.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
