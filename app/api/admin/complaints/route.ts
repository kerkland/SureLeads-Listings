import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const skip = (page - 1) * limit;

    const where = status ? { status: status as 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' } : {};

    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          complainant: { select: { fullName: true, phone: true } },
          agent: { select: { agencyName: true, primaryCity: true, user: { select: { fullName: true } } } },
          listing: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take: limit,
      }),
      prisma.complaint.count({ where }),
    ]);

    return NextResponse.json({ success: true, data: complaints, total, page, limit });
  });
}
