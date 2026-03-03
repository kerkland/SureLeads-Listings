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
    const { action, resolution } = body as { action: 'RESOLVE' | 'DISMISS' | 'UNDER_REVIEW'; resolution?: string };

    if (!action || !['RESOLVE', 'DISMISS', 'UNDER_REVIEW'].includes(action)) {
      return NextResponse.json({ success: false, error: 'action must be RESOLVE, DISMISS, or UNDER_REVIEW' }, { status: 400 });
    }

    const complaint = await prisma.complaint.findUnique({ where: { id: params.id } });
    if (!complaint) return NextResponse.json({ success: false, error: 'Complaint not found' }, { status: 404 });

    const newStatus =
      action === 'RESOLVE'      ? 'RESOLVED'     :
      action === 'DISMISS'      ? 'DISMISSED'    :
      /* UNDER_REVIEW */          'UNDER_REVIEW';

    const isFinalStatus = action !== 'UNDER_REVIEW';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any[] = [
      prisma.complaint.update({
        where: { id: params.id },
        data: {
          status:     newStatus,
          resolution: isFinalStatus ? (resolution ?? null) : undefined,
          resolvedAt: isFinalStatus ? new Date() : undefined,
          resolvedBy: isFinalStatus ? user.sub : undefined,
        },
      }),
    ];

    if (isFinalStatus) {
      ops.push(
        prisma.adminAction.create({
          data: {
            adminId:          user.sub,
            actionType:       'RESOLVE_COMPLAINT',
            targetComplaintId: params.id,
            targetAgentId:    complaint.agentId,
            reason:           resolution ?? null,
          },
        }),
      );
    }

    await prisma.$transaction(ops);

    // Only trigger credibility recalc when complaint is fully resolved/dismissed
    if (isFinalStatus) {
      await credibilityQueue.add('recalculate', { agentId: complaint.agentId }, { jobId: `credibility-${complaint.agentId}` });
    }

    return NextResponse.json({ success: true, data: { status: newStatus } });
  });
}
