/**
 * PATCH /api/admin/subscriptions/[agentId]
 * Change an agent's subscription tier (and optional expiry).
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';

const schema = z.object({
  tier:      z.enum(['STARTER', 'PROFESSIONAL', 'AGENCY']),
  expiresAt: z.string().datetime().optional().nullable(),
});

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const agentId = req.url.split('/').pop()!;
    const body    = await req.json();
    const parsed  = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { tier, expiresAt } = parsed.data;

    const agent = await prisma.agentProfile.findUnique({ where: { id: agentId } });
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const updated = await prisma.agentProfile.update({
      where: { id: agentId },
      data:  {
        subscriptionTier: tier,
        ...(expiresAt !== undefined
          ? { subscriptionExpiresAt: expiresAt ? new Date(expiresAt) : null }
          : {}),
      },
    });

    return NextResponse.json({
      success: true,
      data:    { subscriptionTier: updated.subscriptionTier, subscriptionExpiresAt: updated.subscriptionExpiresAt },
    });
  } catch (err) {
    console.error('[PATCH /api/admin/subscriptions/[agentId]]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);
