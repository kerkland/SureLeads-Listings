import type { CredibilityBreakdown, CredibilityTier } from '@/types';
import CredibilityBadge from '@/components/listings/CredibilityBadge';

interface Props {
  breakdown: CredibilityBreakdown;
}

interface Bar {
  label: string;
  value: number;
  max: number;
  color: string;
}

const TIER_LABEL: Record<CredibilityTier, string> = {
  UNRATED: 'New Agent — no track record yet',
  BRONZE: 'Building credibility',
  SILVER: 'Established agent',
  GOLD: 'Trusted agent',
  PLATINUM: 'Top-rated agent',
};

export default function CredibilityBreakdownPanel({ breakdown }: Props) {
  const { total, tier, components } = breakdown;

  const bars: Bar[] = [
    { label: 'Review Rating', value: components.reviewScore, max: 350, color: 'bg-blue-500' },
    { label: 'Reconfirmation Compliance', value: components.reconfirmationScore, max: 250, color: 'bg-emerald-500' },
    { label: 'Inspection Response Rate', value: components.responseScore, max: 200, color: 'bg-violet-500' },
    { label: 'Account & Verification', value: components.accountScore, max: 50, color: 'bg-amber-500' },
    { label: 'Subscription Bonus', value: components.subscriptionBonus, max: 50, color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="text-4xl font-bold text-sl-slate-900">{total}</div>
        <div>
          <CredibilityBadge score={total} tier={tier} />
          <p className="text-sm text-sl-slate-500 mt-1">{TIER_LABEL[tier]}</p>
        </div>
      </div>

      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-sl-slate-600">{bar.label}</span>
              <span className="font-medium text-sl-slate-900">
                {bar.value} / {bar.max}
              </span>
            </div>
            <div className="h-2 bg-sl-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${bar.color}`}
                style={{ width: `${Math.min(100, (bar.value / bar.max) * 100)}%` }}
              />
            </div>
          </div>
        ))}

        {components.complaintPenalty < 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-red-600">Complaint Penalty</span>
            <span className="font-medium text-red-600">{components.complaintPenalty}</span>
          </div>
        )}
      </div>
    </div>
  );
}
