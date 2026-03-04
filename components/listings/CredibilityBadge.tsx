import type { CredibilityTier } from '@/types';

interface Props {
  score: number;
  tier: CredibilityTier;
  showScore?: boolean;
}

const TIER_CONFIG: Record<CredibilityTier, { label: string; classes: string }> = {
  UNRATED:  { label: 'New',      classes: 'bg-sl-slate-100 text-sl-slate-500 border-sl-slate-200' },
  BRONZE:   { label: 'Bronze',   classes: 'bg-orange-50 text-orange-600 border-orange-200' },
  SILVER:   { label: 'Silver',   classes: 'bg-sl-slate-100 text-sl-slate-600 border-sl-slate-300' },
  GOLD:     { label: 'Gold',     classes: 'bg-sl-gold-50 text-sl-gold-700 border-sl-gold-200' },
  PLATINUM: { label: 'Platinum', classes: 'bg-purple-50 text-purple-700 border-purple-200' },
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
