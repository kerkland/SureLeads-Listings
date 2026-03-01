import prisma from './db';
import type { CredibilityEvent, CredibilityTier, CredibilityBreakdown } from '@/types';

// ─── Score Weights & Caps ────────────────────────────────────────────────────

const MAX_REVIEW_SCORE = 350;
const MAX_RECONFIRMATION_SCORE = 250;
const MAX_RESPONSE_SCORE = 200;
const MAX_COMPLAINT_PENALTY = 150;
const MAX_ACCOUNT_SCORE = 50;

const SUBSCRIPTION_BONUS: Record<string, number> = {
  STARTER: 0,
  PROFESSIONAL: 25,
  AGENCY: 50,
};

const COMPLAINT_PENALTY_PER: Record<string, number> = {
  OPEN: 30,
  RESOLVED_AGAINST: 15,
  DISMISSED: 5,
};

// Rolling window for reconfirmation compliance
const RECONFIRMATION_WINDOW_WEEKS = 12;

// ─── Tier Classification ─────────────────────────────────────────────────────

export function scoreTotier(score: number): CredibilityTier {
  if (score < 100) return 'UNRATED';
  if (score < 300) return 'BRONZE';
  if (score < 550) return 'SILVER';
  if (score < 800) return 'GOLD';
  return 'PLATINUM';
}

// ─── Component Calculations ──────────────────────────────────────────────────

function calcReviewScore(reviewAvg: number): number {
  return Math.round((reviewAvg / 5.0) * MAX_REVIEW_SCORE);
}

function calcReconfirmationScore(rate: number): number {
  return Math.round(rate * MAX_RECONFIRMATION_SCORE);
}

function calcResponseScore(rate: number): number {
  // Neutral default (0.5) when no requests exist — not penalised
  return Math.round(rate * MAX_RESPONSE_SCORE);
}

function calcComplaintPenalty(
  openCount: number,
  resolvedAgainstCount: number,
  dismissedCount: number
): number {
  const penalty =
    openCount * COMPLAINT_PENALTY_PER.OPEN +
    resolvedAgainstCount * COMPLAINT_PENALTY_PER.RESOLVED_AGAINST +
    dismissedCount * COMPLAINT_PENALTY_PER.DISMISSED;
  return Math.min(penalty, MAX_COMPLAINT_PENALTY);
}

function calcAccountScore(
  accountAgeDays: number,
  isVerifiedBadge: boolean,
  hasCac: boolean
): number {
  const ageScore = Math.min(25, (accountAgeDays / 365) * 25);
  const badgeScore = isVerifiedBadge ? 15 : 0;
  const cacScore = hasCac ? 10 : 0;
  return Math.min(MAX_ACCOUNT_SCORE, Math.round(ageScore + badgeScore + cacScore));
}

// ─── Full Recalculation ───────────────────────────────────────────────────────

export async function recalculateCredibility(agentId: string): Promise<void> {
  const profile = await prisma.agentProfile.findUnique({
    where: { id: agentId },
    select: {
      credibilityScore: true,
      scoreReviewAvg: true,
      scoreResponseRate: true,
      totalInspectionRequests: true,
      respondedInspections: true,
      subscriptionTier: true,
      isVerifiedBadge: true,
      cacNumber: true,
      createdAt: true,
    },
  });

  if (!profile) throw new Error(`AgentProfile not found: ${agentId}`);

  // ─── Review average (re-query from reviews table) ─────────────────────────
  const reviewStats = await prisma.review.aggregate({
    where: { agentId, isFlagged: false },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const reviewAvg = reviewStats._avg.rating ?? 0;

  // ─── Reconfirmation compliance rate (rolling 12 weeks) ───────────────────
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - RECONFIRMATION_WINDOW_WEEKS * 7);

  const reconfirmationStats = await prisma.reconfirmationRecord.groupBy({
    by: ['wasOnTime'],
    where: { agentId, confirmedAt: { gte: windowStart } },
    _count: { id: true },
  });

  let onTime = 0;
  let total = 0;
  for (const row of reconfirmationStats) {
    total += row._count.id;
    if (row.wasOnTime) onTime += row._count.id;
  }
  const reconfirmationRate = total === 0 ? 1.0 : onTime / total;

  // ─── Response rate ────────────────────────────────────────────────────────
  const responseRate =
    profile.totalInspectionRequests === 0
      ? 0.5 // neutral default
      : profile.respondedInspections / profile.totalInspectionRequests;

  // ─── Complaint counts ─────────────────────────────────────────────────────
  const complaints = await prisma.complaint.findMany({
    where: { agentId },
    select: { status: true, resolution: true },
  });
  const openCount = complaints.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW').length;
  const resolvedAgainstCount = complaints.filter(
    (c) => c.status === 'RESOLVED'
  ).length;
  const dismissedCount = complaints.filter((c) => c.status === 'DISMISSED').length;

  // ─── Account age ─────────────────────────────────────────────────────────
  const accountAgeDays = Math.floor(
    (Date.now() - profile.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // ─── Build component scores ───────────────────────────────────────────────
  const reviewScore = calcReviewScore(reviewAvg);
  const reconfirmationScore = calcReconfirmationScore(reconfirmationRate);
  const responseScore = calcResponseScore(responseRate);
  const complaintPenalty = calcComplaintPenalty(openCount, resolvedAgainstCount, dismissedCount);
  const accountScore = calcAccountScore(
    accountAgeDays,
    profile.isVerifiedBadge,
    !!profile.cacNumber
  );
  const subscriptionBonus = SUBSCRIPTION_BONUS[profile.subscriptionTier] ?? 0;

  const rawScore =
    reviewScore +
    reconfirmationScore +
    responseScore -
    complaintPenalty +
    accountScore +
    subscriptionBonus;

  const newScore = Math.max(0, Math.min(1000, rawScore));
  const newTier = scoreTotier(newScore);
  const oldScore = profile.credibilityScore;
  const delta = newScore - oldScore;

  // ─── Persist ──────────────────────────────────────────────────────────────
  await prisma.$transaction([
    prisma.agentProfile.update({
      where: { id: agentId },
      data: {
        credibilityScore: newScore,
        credibilityTier: newTier,
        credibilityUpdatedAt: new Date(),
        scoreReviewAvg: reviewAvg,
        scoreReconfirmationRate: reconfirmationRate,
        scoreResponseRate: responseRate,
        scoreComplaintsCount: openCount + resolvedAgainstCount + dismissedCount,
        scoreAccountAgeDays: accountAgeDays,
      },
    }),
    prisma.credibilityLog.create({
      data: {
        agentId,
        event: 'full_recalculation',
        componentKey: 'all',
        delta,
        oldScore,
        newScore,
        metadata: {
          reviewScore,
          reconfirmationScore,
          responseScore,
          complaintPenalty,
          accountScore,
          subscriptionBonus,
        },
      },
    }),
  ]);
}

export function buildBreakdown(profile: {
  credibilityScore: number;
  credibilityTier: string;
  scoreReviewAvg: number;
  scoreReconfirmationRate: number;
  scoreResponseRate: number;
  scoreComplaintsCount: number;
  subscriptionTier: string;
  isVerifiedBadge: boolean;
  cacNumber: string | null;
  scoreAccountAgeDays: number;
}): CredibilityBreakdown {
  const reviewScore = calcReviewScore(profile.scoreReviewAvg);
  const reconfirmationScore = calcReconfirmationScore(profile.scoreReconfirmationRate);
  const responseScore = calcResponseScore(profile.scoreResponseRate);
  const complaintPenalty = Math.min(
    profile.scoreComplaintsCount * 10,
    MAX_COMPLAINT_PENALTY
  );
  const accountScore = calcAccountScore(
    profile.scoreAccountAgeDays,
    profile.isVerifiedBadge,
    !!profile.cacNumber
  );
  const subscriptionBonus = SUBSCRIPTION_BONUS[profile.subscriptionTier] ?? 0;

  return {
    total: profile.credibilityScore,
    tier: profile.credibilityTier as CredibilityTier,
    components: {
      reviewScore,
      reconfirmationScore,
      responseScore,
      complaintPenalty: -complaintPenalty,
      accountScore,
      subscriptionBonus,
    },
  };
}
