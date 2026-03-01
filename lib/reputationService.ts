import prisma from './db';
import type { ReputationEvent } from '@/types';

const EVENT_DELTAS: Record<ReputationEvent, number> = {
  review_5_star: 15,
  review_4_star: 8,
  review_3_star: 3,
  review_2_star: -2,
  review_1_star: -8,
  cross_post_violation: -50,
};

/**
 * Apply a reputation event atomically.
 * Score is clamped to [0, 1000].
 */
export async function applyEvent(
  agentId: string,
  event: ReputationEvent,
  metadata?: Record<string, unknown>
): Promise<void> {
  const delta = EVENT_DELTAS[event];
  if (delta === undefined) throw new Error(`Unknown reputation event: ${event}`);

  // Atomic update with clamping via SQL GREATEST/LEAST
  await prisma.$executeRaw`
    UPDATE agent_profiles
    SET "reputationScore" = GREATEST(0, LEAST(1000, "reputationScore" + ${delta}))
    WHERE id = ${agentId}
  `;

  await prisma.reputationLog.create({
    data: {
      agentId,
      event,
      delta,
      metadata: (metadata ?? {}) as object,
    },
  });
}

export async function getReputationScore(agentId: string): Promise<number> {
  const profile = await prisma.agentProfile.findUnique({
    where: { id: agentId },
    select: { reputationScore: true },
  });
  return profile?.reputationScore ?? 500;
}
