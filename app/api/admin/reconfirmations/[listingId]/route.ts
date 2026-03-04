/**
 * PATCH /api/admin/reconfirmations/[listingId]
 * Extend reconfirmation deadline or reinstate a hidden listing.
 *
 * Body: { action: 'extend', days: number } | { action: 'reinstate' }
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('extend'),    days: z.number().int().min(1).max(30) }),
  z.object({ action: z.literal('reinstate') }),
]);

export const PATCH = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const listingId = req.url.split('/').pop()!;
    const body      = await req.json();
    const parsed    = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    if (parsed.data.action === 'extend') {
      const base   = listing.nextReconfirmationDue ?? new Date();
      const newDue = new Date(base.getTime() + parsed.data.days * 24 * 60 * 60 * 1000);

      const updated = await prisma.listing.update({
        where: { id: listingId },
        data:  {
          nextReconfirmationDue: newDue,
          // Restore to AVAILABLE if it was hidden
          ...(listing.status === 'HIDDEN' ? {
            status:        'AVAILABLE',
            hiddenAt:      null,
            graceExpiresAt: null,
          } : {}),
        },
      });

      return NextResponse.json({
        success: true,
        data:    { nextReconfirmationDue: updated.nextReconfirmationDue, status: updated.status },
      });
    }

    // Reinstate: restore hidden listing without changing due date
    const updated = await prisma.listing.update({
      where: { id: listingId },
      data:  {
        status:        'AVAILABLE',
        hiddenAt:      null,
        graceExpiresAt: null,
      },
    });

    return NextResponse.json({ success: true, data: { status: updated.status } });
  } catch (err) {
    console.error('[PATCH /api/admin/reconfirmations/[listingId]]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN']);
