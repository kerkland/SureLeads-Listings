import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['ADMIN'], async (user) => {
    const { reason } = await req.json();
    await prisma.$transaction([
      prisma.listing.update({ where: { id: params.id }, data: { isAdminFlagged: true } }),
      prisma.adminAction.create({ data: { adminId: user.sub, actionType: 'FLAG_LISTING', targetListingId: params.id, reason: reason ?? null } }),
    ]);
    return NextResponse.json({ success: true });
  });
}
