import type { CredibilityTier } from '@/types';

interface Props {
  score: number;
  tier: CredibilityTier;
  showScore?: boolean;
}

const TIER_CONFIG: Record<CredibilityTier, { label: string; classes: string }> = {
  UNRATED: { label: 'New', classes: 'bg-gray-100 text-gray-600 border-gray-300' },
  BRONZE: { label: 'Bronze', classes: 'bg-orange-100 text-orange-700 border-orange-300' },
  SILVER: { label: 'Silver', classes: 'bg-slate-100 text-slate-700 border-slate-300' },
  GOLD: { label: 'Gold', classes: 'bg-yellow-100 text-yellow-700 border-yellow-400' },
  PLATINUM: { label: 'Platinum', classes: 'bg-teal-100 text-teal-700 border-teal-400' },
};

export default function CredibilityBadge({ score, tier, showScore = false }: Props) {
  const config = TIER_CONFIG[tier] ?? TIER_CONFIG.UNRATED;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-xs px-2.5 py-0.5 font-medium border ${config.classes}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {config.label}
      {showScore && <span className="opacity-70">· {score}</span>}
    </span>
  );
}
