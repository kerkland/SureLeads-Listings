import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    await prisma.$transaction([
      prisma.listing.update({ where: { id: params.id }, data: { isAdminFlagged: false } }),
      prisma.adminAction.create({ data: { adminId: user.sub, actionType: 'UNFLAG_LISTING', targetListingId: params.id } }),
    ]);
    return NextResponse.json({ success: true });
  });
}
