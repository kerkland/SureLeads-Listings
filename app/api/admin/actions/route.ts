import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const actionType = searchParams.get('actionType');
    const adminId = searchParams.get('adminId');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '50');
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (actionType) where.actionType = actionType;
    if (adminId) where.adminId = adminId;

    const [actions, total] = await Promise.all([
      prisma.adminAction.findMany({
        where,
        include: {
          admin: { select: { fullName: true } },
          targetListing: { select: { title: true } },
          targetAgent: { select: { agencyName: true, user: { select: { fullName: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.adminAction.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: actions, total, page, limit });
  });
}
