import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['AGENT', 'CLIENT'], async (user) => {
    const inspectionId = params.id;
    const body = await req.json();
    const { status, confirmedDate, agentNotes } = body;

    const inspection = await prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: { agent: { select: { id: true, userId: true } } },
    });

    if (!inspection) {
      return NextResponse.json({ success: false, error: 'Inspection not found' }, { status: 404 });
    }

    const isAgent = user.role === 'AGENT' && inspection.agent.userId === user.sub;
    const isClient = user.role === 'CLIENT' && inspection.clientId === user.sub;

    if (!isAgent && !isClient) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const wasUnresponded = inspection.status === 'REQUESTED';

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (confirmedDate && isAgent) updateData.confirmedDate = new Date(confirmedDate);
    if (agentNotes && isAgent) updateData.agentNotes = agentNotes;
    if (status === 'COMPLETED') updateData.completedAt = now;
    if (status === 'CANCELLED') {
      updateData.cancelledAt = now;
      updateData.cancelledBy = user.sub;
    }

    // Track first response time
    if (isAgent && wasUnresponded && status !== 'REQUESTED') {
      updateData.respondedAt = now;
      await prisma.agentProfile.update({
        where: { id: inspection.agentId },
        data: { respondedInspections: { increment: 1 } },
      });
      await credibilityQueue.add(
        'recalculate',
        { agentId: inspection.agentId },
        { jobId: `credibility-${inspection.agentId}` }
      );
    }

    const updated = await prisma.inspection.update({
      where: { id: inspectionId },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated });
  });
}
