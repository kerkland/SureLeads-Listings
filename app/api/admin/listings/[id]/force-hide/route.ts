/**
 * POST /api/admin/listings/[id]/force-hide
 * Immediately set a listing to HIDDEN status and create an AdminAction record.
 *
 * Body: { reason?: string }
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const body = await req.json() as { reason?: string };

    const listing = await prisma.listing.findUnique({ where: { id: params.id }, select: { id: true, status: true } });
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }
    if (listing.status === 'HIDDEN') {
      return NextResponse.json({ success: false, error: 'Listing is already hidden' }, { status: 409 });
    }

    await prisma.$transaction([
      prisma.listing.update({
        where: { id: params.id },
        data: { status: 'HIDDEN', hiddenAt: new Date() },
      }),
      prisma.adminAction.create({
        data: {
          adminId:        user.sub,
          actionType:     'FORCE_HIDE_LISTING',
          targetListingId: params.id,
          reason:         body.reason ?? null,
        },
      }),
    ]);

    return NextResponse.json({ success: true, message: 'Listing hidden' });
  });
}
