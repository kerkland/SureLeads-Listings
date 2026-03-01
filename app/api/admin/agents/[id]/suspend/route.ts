import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const { reason } = await req.json();
    if (!reason) return NextResponse.json({ success: false, error: 'reason is required' }, { status: 400 });

    const agent = await prisma.agentProfile.findUnique({ where: { id: params.id }, select: { userId: true } });
    if (!agent) return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });

    await prisma.$transaction([
      prisma.user.update({ where: { id: agent.userId }, data: { isSuspended: true, suspendedAt: new Date(), suspendedBy: user.sub } }),
      prisma.listing.updateMany({ where: { agentId: agent.userId, status: 'AVAILABLE' }, data: { status: 'HIDDEN', hiddenAt: new Date() } }),
      prisma.adminAction.create({ data: { adminId: user.sub, actionType: 'SUSPEND_AGENT', targetAgentId: params.id, reason } }),
    ]);

    return NextResponse.json({ success: true, message: 'Agent suspended and listings hidden' });
  });
}
