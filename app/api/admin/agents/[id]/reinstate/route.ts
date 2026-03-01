import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const { reason } = await req.json();
    const agent = await prisma.agentProfile.findUnique({ where: { id: params.id }, select: { userId: true } });
    if (!agent) return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.user.update({ where: { id: agent.userId }, data: { isSuspended: false, suspendedAt: null, suspendedBy: null } }),
      prisma.adminAction.create({ data: { adminId: user.sub, actionType: 'REINSTATE_AGENT', targetAgentId: params.id, reason: reason ?? null } }),
    ]);

    return NextResponse.json({ success: true, message: 'Agent reinstated' });
  });
}
