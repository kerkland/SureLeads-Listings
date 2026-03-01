import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['AGENT', 'CLIENT'], async (user) => {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const skip = (page - 1) * limit;

    const where =
      user.role === 'CLIENT'
        ? { clientId: user.sub }
        : {
            agent: { userId: user.sub },
          };

    const [inspections, total] = await Promise.all([
      prisma.inspection.findMany({
        where,
        include: {
          listing: { select: { id: true, title: true, area: true, city: true, photos: true } },
          client: { select: { id: true, fullName: true, phone: true } },
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inspection.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: inspections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  });
}
