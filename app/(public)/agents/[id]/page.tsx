import { notFound } from 'next/navigation';
import CredibilityBadge from '@/components/listings/CredibilityBadge';
import CredibilityBreakdownPanel from '@/components/dashboard/CredibilityBreakdown';
import type { CredibilityBreakdown, CredibilityTier } from '@/types';

interface Props { params: { id: string } }

async function getAgent(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const res = await fetch(`${baseUrl}/api/agents/${id}/profile`, { cache: 'no-store' });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export default async function AgentProfilePage({ params }: Props) {
  const agent = await getAgent(params.id);
  if (!agent) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl border p-6 flex items-start gap-5 mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            {agent.profilePhoto ? (
              <img src={agent.profilePhoto} alt={agent.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500">
                {agent.fullName[0]}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900">{agent.fullName}</h1>
              {agent.isVerifiedBadge && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium border border-blue-200">
                  ✓ Verified
                </span>
              )}
            </div>
            {agent.agencyName && <p className="text-gray-500 text-sm">{agent.agencyName}</p>}
            <p className="text-sm text-gray-500 mt-0.5">{agent.primaryCity}</p>
            <div className="mt-2">
              <CredibilityBadge score={agent.credibilityScore} tier={agent.credibilityTier as CredibilityTier} showScore />
            </div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div>{agent.reviewCount} reviews</div>
            <div>{agent.completedInspections} inspections</div>
            <div>Since {new Date(agent.memberSince).getFullYear()}</div>
          </div>
        </div>

        {/* Bio */}
        {agent.bio && (
          <div className="bg-white rounded-2xl border p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">About</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{agent.bio}</p>
          </div>
        )}

        {/* Credibility Breakdown */}
        <div className="bg-white rounded-2xl border p-6 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Credibility Score</h2>
          <CredibilityBreakdownPanel breakdown={agent.credibilityBreakdown as CredibilityBreakdown} />
        </div>

        {/* Recent Reviews */}
        {agent.recentReviews?.length > 0 && (
          <div className="bg-white rounded-2xl border p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">Recent Reviews</h2>
            <div className="space-y-4">
              {agent.recentReviews.map((r: { id: string; rating: number; body?: string; reviewer: { fullName: string }; createdAt: string }) => (
                <div key={r.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
                    {r.reviewer.fullName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{r.reviewer.fullName}</span>
                      <span className="text-yellow-500 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    {r.body && <p className="text-sm text-gray-600 mt-0.5">{r.body}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(r.createdAt).toLocaleDateString('en-NG')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
