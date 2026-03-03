/**
 * PATCH /api/admin/listings/[id]/tier
 * Promote (BASIC → VERIFIED) or demote (VERIFIED → BASIC) a listing's tier.
 *
 * Body: { tier: 'BASIC' | 'VERIFIED' }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { priceIndexQueue } from '@/lib/queue';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const { tier } = await req.json() as { tier: 'BASIC' | 'VERIFIED' };

    if (!tier || !['BASIC', 'VERIFIED'].includes(tier)) {
      return NextResponse.json(
        { success: false, error: 'tier must be BASIC or VERIFIED' },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      select: { id: true, tier: true, city: true, area: true, propertyType: true, bedrooms: true },
    });
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    const promoting = tier === 'VERIFIED';
    const actionType = promoting ? 'PROMOTE_LISTING_TIER' : 'DEMOTE_LISTING_TIER';

    await prisma.$transaction([
      prisma.listing.update({
        where: { id: params.id },
        data: {
          tier,
          // When promoting to VERIFIED set first reconfirmation due in 7 days
          ...(promoting && {
            lastReconfirmedAt:     new Date(),
            nextReconfirmationDue: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          }),
          // When demoting, clear reconfirmation fields
          ...(!promoting && {
            nextReconfirmationDue:     null,
            pendingReconfirmationAt:   null,
          }),
        },
      }),
      prisma.adminAction.create({
        data: {
          adminId:        user.sub,
          actionType,
          targetListingId: params.id,
          reason:         `Tier changed from ${listing.tier} to ${tier}`,
        },
      }),
    ]);

    // Re-index price data when tier changes
    await priceIndexQueue.add('recalculate', {
      city: listing.city, area: listing.area,
      propertyType: listing.propertyType, bedrooms: listing.bedrooms,
    });

    return NextResponse.json({ success: true, data: { tier } });
  });
}
