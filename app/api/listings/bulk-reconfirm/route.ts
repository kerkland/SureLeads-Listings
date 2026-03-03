/**
 * POST /api/listings/bulk-reconfirm
 *
 * Reconfirm up to 50 VERIFIED listings in a single request.
 * Validates that all listings belong to the authenticated agent.
 * No price update in bulk mode — use single reconfirm for price changes.
 *
 * Body: { listingIds: string[] }
 * Returns: { succeeded: string[], failed: { id: string, error: string }[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

const MAX_BULK = 50;
const RECONFIRMABLE_STATUSES = ['AVAILABLE', 'PENDING_RECONFIRMATION', 'HIDDEN'] as const;

export async function POST(req: NextRequest) {
  return withAuth(req, ['AGENT'], async (user) => {
    const body = await req.json() as { listingIds?: string[] };

    if (!Array.isArray(body.listingIds) || body.listingIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'listingIds must be a non-empty array' },
        { status: 400 },
      );
    }

    if (body.listingIds.length > MAX_BULK) {
      return NextResponse.json(
        { success: false, error: `Cannot bulk-reconfirm more than ${MAX_BULK} listings at once` },
        { status: 400 },
      );
    }

    // Fetch only listings owned by this agent, VERIFIED, not deleted
    const listings = await prisma.listing.findMany({
      where: {
        id:        { in: body.listingIds },
        agentId:   user.sub,
        tier:      'VERIFIED',
        deletedAt: null,
        status:    { in: [...RECONFIRMABLE_STATUSES] },
      },
      select: {
        id:                    true,
        status:                true,
        nextReconfirmationDue: true,
      },
    });

    // Track which IDs were not found / not eligible
    const foundIds   = new Set(listings.map((l) => l.id));
    const succeeded: string[] = [];
    const failed:    { id: string; error: string }[] = [];

    for (const requestedId of body.listingIds) {
      if (!foundIds.has(requestedId)) {
        failed.push({ id: requestedId, error: 'Not found, not owned, or not eligible' });
      }
    }

    // Process each eligible listing
    const now = new Date();
    const nextDue = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const listing of listings) {
      try {
        const wasOnTime = listing.status !== 'HIDDEN';

        await prisma.$transaction([
          prisma.reconfirmationRecord.create({
            data: {
              listingId: listing.id,
              agentId:   user.sub,
              dueAt:     listing.nextReconfirmationDue ?? now,
              wasOnTime,
              method:    'AGENT_ACTION',
            },
          }),
          prisma.listing.update({
            where: { id: listing.id },
            data:  {
              status:                  'AVAILABLE',
              lastReconfirmedAt:       now,
              nextReconfirmationDue:   nextDue,
              hiddenAt:                null,
              pendingReconfirmationAt: null,
              graceExpiresAt:          null,
            },
          }),
        ]);

        succeeded.push(listing.id);
      } catch (err) {
        failed.push({
          id:    listing.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Single credibility recalc after all confirms
    if (succeeded.length > 0) {
      await credibilityQueue.add(
        'recalculate',
        { agentId: user.sub },
        { jobId: `credibility-${user.sub}` },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        succeeded,
        failed,
        nextReconfirmationDue: nextDue,
      },
    });
  });
}
