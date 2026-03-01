import type { ListingTier } from '@/types';

interface Props {
  tier: ListingTier;
  videoApproved?: boolean;
  size?: 'sm' | 'md';
}

export default function TierBadge({ tier, videoApproved = false, size = 'md' }: Props) {
  if (tier !== 'VERIFIED') return null;

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass} ${
        videoApproved
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
          : 'bg-amber-100 text-amber-700 border border-amber-300'
      }`}
    >
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 1.944A11.954 11.954 0 0 1 2.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0 1 10 1.944ZM11 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0-7a1 1 0 1 0-2 0v3a1 1 0 1 0 2 0V7Z"
          clipRule="evenodd"
        />
      </svg>
      {videoApproved ? 'Verified' : 'Pending Verification'}
    </span>
  );
}
