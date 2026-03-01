import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['AGENT'], async (user) => {
    const listingId = params.id;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, agentId: true, tier: true, status: true, nextReconfirmationDue: true },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }
    if (listing.agentId !== user.sub) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (listing.tier !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'Only VERIFIED listings require reconfirmation' },
        { status: 400 }
      );
    }
    if (!['AVAILABLE', 'PENDING_RECONFIRMATION', 'HIDDEN'].includes(listing.status)) {
      return NextResponse.json(
        { success: false, error: 'Listing cannot be reconfirmed in its current status' },
        { status: 400 }
      );
    }

    const now = new Date();
    const wasOnTime = listing.status !== 'HIDDEN';
    const nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.reconfirmationRecord.create({
        data: {
          listingId,
          agentId: user.sub,
          dueAt: listing.nextReconfirmationDue ?? now,
          wasOnTime,
          method: 'AGENT_ACTION',
        },
      }),
      prisma.listing.update({
        where: { id: listingId },
        data: {
          status: 'AVAILABLE',
          lastReconfirmedAt: now,
          nextReconfirmationDue: nextDue,
          hiddenAt: null,
          pendingReconfirmationAt: null,
        },
      }),
    ]);

    await credibilityQueue.add(
      'recalculate',
      { agentId: user.sub },
      { jobId: `credibility-${user.sub}` }
    );

    return NextResponse.json({
      success: true,
      data: { nextReconfirmationDue: nextDue, wasOnTime },
    });
  });
}
