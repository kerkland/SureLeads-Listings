import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['CLIENT'], async (user) => {
    const listingId = params.id;
    const body = await req.json();
    const { proposedDate, notes } = body;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        agentId: true,
        status: true,
        inspectionFee: true,
        agent: { select: { agentProfile: { select: { id: true } } } },
      },
    });

    if (!listing || listing.status !== 'AVAILABLE') {
      return NextResponse.json(
        { success: false, error: 'Listing not found or unavailable' },
        { status: 404 }
      );
    }

    const agentProfile = listing.agent.agentProfile;
    if (!agentProfile) {
      return NextResponse.json({ success: false, error: 'Agent profile not found' }, { status: 400 });
    }

    const inspection = await prisma.inspection.create({
      data: {
        listingId,
        clientId: user.sub,
        agentId: agentProfile.id,
        inspectionFeeKobo: listing.inspectionFee,
        proposedDate: proposedDate ? new Date(proposedDate) : null,
        notes: notes ?? null,
      },
    });

    // Track inspection request on agent profile
    await prisma.agentProfile.update({
      where: { id: agentProfile.id },
      data: { totalInspectionRequests: { increment: 1 } },
    });

    return NextResponse.json({ success: true, data: inspection }, { status: 201 });
  });
}
