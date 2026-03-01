import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const agent = await prisma.agentProfile.findUnique({ where: { id: params.id } });
    if (!agent) return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.agentProfile.update({ where: { id: params.id }, data: { isVerifiedBadge: true } }),
      prisma.adminAction.create({ data: { adminId: user.sub, actionType: 'APPROVE_AGENT_VERIFICATION', targetAgentId: params.id } }),
    ]);

    await credibilityQueue.add('recalculate', { agentId: params.id }, { jobId: `credibility-${params.id}` });

    return NextResponse.json({ success: true, message: 'Agent verification badge granted' });
  });
}
