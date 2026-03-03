/**
 * PATCH /api/admin/cross-posts/[id]
 * Resolve a CrossPostingFlag.
 *
 * Resolution rules (no agents are suspended, no listings are auto-hidden):
 *   CONFIRM   — Cross-post is genuine. The listing with the earlier createdAt is the
 *               original; its isCrossPostFlagged is cleared. The duplicate keeps the flag.
 *               Status → AGENT_A_WINS or AGENT_B_WINS (whichever is the original).
 *   DISMISSED — False positive. Both listings have isCrossPostFlagged cleared.
 *   BOTH_PAUSED — Egregious fraud. Both listings are hidden (admin discretion).
 *
 * Body: { action: 'CONFIRM' | 'DISMISSED' | 'BOTH_PAUSED' }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const body = await req.json() as { action: 'CONFIRM' | 'DISMISSED' | 'BOTH_PAUSED' };

    if (!['CONFIRM', 'DISMISSED', 'BOTH_PAUSED'].includes(body.action)) {
      return NextResponse.json(
        { success: false, error: 'action must be CONFIRM, DISMISSED, or BOTH_PAUSED' },
        { status: 400 },
      );
    }

    const flag = await prisma.crossPostingFlag.findUnique({
      where:  { id: params.id },
      select: {
        id:         true,
        status:     true,
        listingAId: true,
        listingBId: true,
        listingA:   { select: { createdAt: true } },
        listingB:   { select: { createdAt: true } },
      },
    });

    if (!flag) {
      return NextResponse.json({ success: false, error: 'Cross-post flag not found' }, { status: 404 });
    }
    if (flag.status !== 'OPEN') {
      return NextResponse.json({ success: false, error: 'Flag is already resolved' }, { status: 409 });
    }

    // Determine which listing is the original (earlier createdAt = original)
    const aIsOriginal = flag.listingA.createdAt <= flag.listingB.createdAt;
    const originalId  = aIsOriginal ? flag.listingAId : flag.listingBId;
    const duplicateId = aIsOriginal ? flag.listingBId : flag.listingAId;
    // Prisma enum status for "original agent wins"
    const winnerStatus = aIsOriginal ? 'AGENT_A_WINS' : 'AGENT_B_WINS';

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any[] = [];

    if (body.action === 'CONFIRM') {
      // Mark flag as resolved with the original agent winning
      ops.push(
        prisma.crossPostingFlag.update({
          where: { id: params.id },
          data:  { status: winnerStatus, resolvedAt: new Date() },
        }),
      );
      // Clear the cross-post flag on the original (it's legitimately first)
      ops.push(
        prisma.listing.update({
          where: { id: originalId },
          data:  { isCrossPostFlagged: false },
        }),
      );
      // Keep isCrossPostFlagged=true on the duplicate — it stays labelled
      // (no status change, no hiding — agents are NOT penalised)

    } else if (body.action === 'DISMISSED') {
      // False positive — clear both flags
      ops.push(
        prisma.crossPostingFlag.update({
          where: { id: params.id },
          data:  { status: 'DISMISSED', resolvedAt: new Date() },
        }),
      );
      ops.push(
        prisma.listing.updateMany({
          where: { id: { in: [flag.listingAId, flag.listingBId] } },
          data:  { isCrossPostFlagged: false },
        }),
      );

    } else {
      // BOTH_PAUSED — egregious fraud, hide both listings
      ops.push(
        prisma.crossPostingFlag.update({
          where: { id: params.id },
          data:  { status: 'BOTH_PAUSED', resolvedAt: new Date() },
        }),
      );
      ops.push(
        prisma.listing.updateMany({
          where: { id: { in: [flag.listingAId, flag.listingBId] } },
          data:  { status: 'HIDDEN', hiddenAt: new Date() },
        }),
      );
    }

    // Audit log
    ops.push(
      prisma.adminAction.create({
        data: {
          adminId:         user.sub,
          actionType:      'RESOLVE_CROSS_POST',
          targetListingId: originalId,
          reason:          body.action === 'CONFIRM'
            ? `Cross-post confirmed — original: ${originalId}, duplicate: ${duplicateId}`
            : body.action === 'DISMISSED'
            ? 'Cross-post dismissed as false positive'
            : 'Both listings hidden (fraud)',
          metadata: {
            crossPostFlagId: params.id,
            action:          body.action,
            originalListingId: body.action === 'CONFIRM' ? originalId : null,
            duplicateListingId: body.action === 'CONFIRM' ? duplicateId : null,
          },
        },
      }),
    );

    await prisma.$transaction(ops);

    return NextResponse.json({
      success: true,
      data: {
        status:            body.action === 'CONFIRM' ? winnerStatus : body.action,
        originalListingId: body.action === 'CONFIRM' ? originalId : null,
        duplicateListingId: body.action === 'CONFIRM' ? duplicateId : null,
      },
    });
  });
}
