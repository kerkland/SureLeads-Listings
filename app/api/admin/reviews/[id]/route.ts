/**
 * PATCH /api/admin/reviews/[id]
 * Flag, unflag, or dismiss (delete) a review.
 *
 * Body: { action: 'FLAG', reason: string } | { action: 'UNFLAG' } | { action: 'DISMISS' }
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('FLAG'),    reason: z.string().min(3).max(500) }),
  z.object({ action: z.literal('UNFLAG') }),
  z.object({ action: z.literal('DISMISS') }),
]);

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const reviewId = req.url.split('/').pop()!;
    const body     = await req.json();
    const parsed   = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      return NextResponse.json({ success: false, error: 'Review not found' }, { status: 404 });
    }

    if (parsed.data.action === 'FLAG') {
      await prisma.review.update({
        where: { id: reviewId },
        data:  {
          isFlagged:     true,
          flaggedReason: parsed.data.reason,
          flaggedAt:     new Date(),
        },
      });
    } else if (parsed.data.action === 'UNFLAG') {
      await prisma.review.update({
        where: { id: reviewId },
        data:  { isFlagged: false, flaggedReason: null, flaggedAt: null },
      });
    } else {
      // DISMISS — hard delete the review
      await prisma.review.delete({ where: { id: reviewId } });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATCH /api/admin/reviews/[id]]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);
