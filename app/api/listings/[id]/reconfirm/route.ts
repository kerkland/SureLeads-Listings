/**
 * POST /api/listings/[id]/reconfirm
 *
 * Reconfirm a VERIFIED listing to keep it visible for another 7 days.
 * Optionally accepts a new rent price — if provided and different from the
 * current rent, a ListingPriceHistory record is created and the listing price
 * is updated.
 *
 * Body (optional): { newRentPerYear?: number }  — value in kobo
 *
 * Allowed statuses: AVAILABLE | PENDING_RECONFIRMATION | HIDDEN
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(req, ['AGENT'], async (user) => {
    const listingId = params.id;

    // Parse optional body — tolerate missing/empty body gracefully
    let newRentRaw: number | undefined;
    try {
      const body = await req.json() as { newRentPerYear?: number };
      newRentRaw = body.newRentPerYear;
    } catch {
      // no body is fine
    }

    const listing = await prisma.listing.findUnique({
      where:  { id: listingId },
      select: {
        id:                    true,
        agentId:               true,
        tier:                  true,
        status:                true,
        rentPerYear:           true,
        nextReconfirmationDue: true,
      },
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
        { status: 400 },
      );
    }
    if (!['AVAILABLE', 'PENDING_RECONFIRMATION', 'HIDDEN'].includes(listing.status)) {
      return NextResponse.json(
        { success: false, error: 'Listing cannot be reconfirmed in its current status' },
        { status: 400 },
      );
    }

    const now       = new Date();
    const wasOnTime = listing.status !== 'HIDDEN';
    const nextDue   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Price change detection
    const newRent     = newRentRaw != null ? BigInt(Math.round(newRentRaw)) : null;
    const priceChanged =
      newRent !== null &&
      newRent > BigInt(0) &&
      newRent !== listing.rentPerYear;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any[] = [
      // Always: record this reconfirmation
      prisma.reconfirmationRecord.create({
        data: {
          listingId,
          agentId:   user.sub,
          dueAt:     listing.nextReconfirmationDue ?? now,
          wasOnTime,
          method:    'AGENT_ACTION',
        },
      }),
      // Always: restore AVAILABLE + reset due date + clear grace period
      prisma.listing.update({
        where: { id: listingId },
        data:  {
          status:                  'AVAILABLE',
          lastReconfirmedAt:       now,
          nextReconfirmationDue:   nextDue,
          hiddenAt:                null,
          pendingReconfirmationAt: null,
          graceExpiresAt:          null, // clear grace period on reactivation
        },
      }),
    ];

    if (priceChanged) {
      // Create price history record
      ops.push(
        prisma.listingPriceHistory.create({
          data: {
            listingId,
            oldRentPerYear: listing.rentPerYear,
            newRentPerYear: newRent!,
            changedBy:      user.sub,
            source:         'RECONFIRMATION',
          },
        }),
      );
      // Apply new rent
      ops.push(
        prisma.listing.update({
          where: { id: listingId },
          data:  { rentPerYear: newRent! },
        }),
      );
    }

    await prisma.$transaction(ops);

    await credibilityQueue.add(
      'recalculate',
      { agentId: user.sub },
      { jobId: `credibility-${user.sub}` },
    );

    return NextResponse.json({
      success: true,
      data: {
        nextReconfirmationDue: nextDue,
        wasOnTime,
        priceChanged,
        newRentPerYear: priceChanged ? newRent!.toString() : null,
      },
    });
  });
}
