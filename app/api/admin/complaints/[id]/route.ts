import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const body = await req.json();
    const { action, resolution } = body as { action: 'RESOLVE' | 'DISMISS'; resolution?: string };

    if (!action || !['RESOLVE', 'DISMISS'].includes(action)) {
      return NextResponse.json({ success: false, error: 'action must be RESOLVE or DISMISS' }, { status: 400 });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id: params.id } });
    if (!complaint) return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });

    const newStatus = action === 'RESOLVE' ? 'RESOLVED' : 'DISMISSED';

    await prisma.$transaction([
      prisma.complaint.update({
        where: { id: params.id },
        data: { status: newStatus, resolution: resolution ?? null, resolvedAt: new Date(), resolvedBy: user.sub },
      }),
      prisma.adminAction.create({
        data: {
          adminId: user.sub,
          actionType: 'RESOLVE_COMPLAINT',
          targetComplaintId: params.id,
          targetAgentId: complaint.agentId,
          reason: resolution ?? null,
        },
      }),
    ]);

    await credibilityQueue.add('recalculate', { agentId: complaint.agentId }, { jobId: `credibility-${complaint.agentId}` });

    return NextResponse.json({ success: true, data: { status: newStatus } });
  });
}
