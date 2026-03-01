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
    const { action, reason } = body as { action: 'APPROVE' | 'REJECT'; reason?: string };

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ success: false, error: 'action must be APPROVE or REJECT' }, { status: 400 });
    }
    if (action === 'REJECT' && !reason) {
      return NextResponse.json({ success: false, error: 'reason is required for REJECT' }, { status: 400 });
    }

    const walkthrough = await prisma.videoWalkthrough.findUnique({
      where: { id: params.id },
      include: { listing: { select: { agentId: true, agent: { select: { agentProfile: { select: { id: true } } } } } } },
    });
    if (!walkthrough) {
      return NextResponse.json({ success: false, error: 'Video walkthrough not found' }, { status: 404 });
    }

    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    await prisma.$transaction([
      prisma.videoWalkthrough.update({
        where: { id: params.id },
        data: { status: newStatus, reviewedAt: new Date(), reviewedBy: user.sub, rejectionReason: reason ?? null },
      }),
      prisma.adminAction.create({
        data: {
          adminId: user.sub,
          actionType: action === 'APPROVE' ? 'APPROVE_VIDEO_WALKTHROUGH' : 'REJECT_VIDEO_WALKTHROUGH',
          targetListingId: walkthrough.listingId,
          reason: reason ?? null,
        },
      }),
    ]);

    const agentProfileId = walkthrough.listing.agent.agentProfile?.id;
    if (agentProfileId) {
      await credibilityQueue.add('recalculate', { agentId: agentProfileId }, { jobId: `credibility-${agentProfileId}` });
    }

    return NextResponse.json({ success: true, data: { status: newStatus } });
  });
}
