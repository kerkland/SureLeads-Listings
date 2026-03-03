/**
 * POST /api/admin/agents/[id]/override-credibility
 * Set or clear a manual credibility score override for an agent.
 *
 * Body: { score: number | null, note?: string }
 *   score=null → clear override and revert to computed score
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const body = await req.json() as { score: number | null; note?: string };

    if (body.score !== null && (typeof body.score !== 'number' || body.score < 0 || body.score > 1000)) {
      return NextResponse.json(
        { success: false, error: 'score must be null or a number between 0 and 1000' },
        { status: 400 },
      );
    }

    const agent = await prisma.agentProfile.findUnique({ where: { id: params.id } });
    if (!agent) {
      return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
    }

    const clearing = body.score === null;

    await prisma.$transaction([
      prisma.agentProfile.update({
        where: { id: params.id },
        data: {
          scoreOverride:     body.score,
          scoreOverrideNote: clearing ? null : (body.note ?? null),
          scoreOverriddenAt: clearing ? null : new Date(),
          scoreOverriddenBy: clearing ? null : user.sub,
        },
      }),
      prisma.adminAction.create({
        data: {
          adminId:      user.sub,
          actionType:   'OVERRIDE_CREDIBILITY_SCORE',
          targetAgentId: params.id,
          reason:       clearing ? 'Override cleared' : (body.note ?? null),
          metadata:     { newScore: body.score, previousScore: agent.credibilityScore },
        },
      }),
    ]);

    // Trigger recalculation so credibilityScore field is updated immediately
    await credibilityQueue.add(
      'recalculate',
      { agentId: params.id },
      { jobId: `credibility-${params.id}` },
    );

    return NextResponse.json({
      success: true,
      message: clearing ? 'Override cleared — computed score will be restored' : `Score overridden to ${body.score}`,
    });
  });
}
