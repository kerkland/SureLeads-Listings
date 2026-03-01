import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'PENDING_REVIEW';
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const skip = (page - 1) * limit;

    const [walkthroughs, total] = await Promise.all([
      prisma.videoWalkthrough.findMany({
        where: { status: status as 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' },
        include: {
          listing: {
            select: {
              id: true, title: true, area: true, city: true,
              agent: { select: { fullName: true, agentProfile: { select: { agencyName: true } } } },
            },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.videoWalkthrough.count({ where: { status: status as 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' } }),
    ]);

    return NextResponse.json({ success: true, data: walkthroughs, total, page, limit });
  });
}
