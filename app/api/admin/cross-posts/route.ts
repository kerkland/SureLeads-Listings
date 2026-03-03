/**
 * GET /api/admin/cross-posts
 * Returns CrossPostingFlag records with status=OPEN (or all if ?status=all)
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') ?? 'OPEN';
    const page   = parseInt(searchParams.get('page')  ?? '1');
    const limit  = parseInt(searchParams.get('limit') ?? '20');
    const skip   = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = status === 'all' ? {} : { status };

    const [flags, total] = await Promise.all([
      prisma.crossPostingFlag.findMany({
        where,
        include: {
          listingA: {
            select: {
              id: true, title: true, area: true, city: true, rentPerYear: true, createdAt: true,
              agent: { select: { fullName: true, agentProfile: { select: { agencyName: true } } } },
            },
          },
          listingB: {
            select: {
              id: true, title: true, area: true, city: true, rentPerYear: true, createdAt: true,
              agent: { select: { fullName: true, agentProfile: { select: { agencyName: true } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.crossPostingFlag.count({ where }),
    ]);

    // Serialize BigInt fields
    const data = flags.map((f) => ({
      ...f,
      listingA: { ...f.listingA, rentPerYear: f.listingA.rentPerYear.toString() },
      listingB: { ...f.listingB, rentPerYear: f.listingB.rentPerYear.toString() },
    }));

    return NextResponse.json({ success: true, data, total, page, limit });
  });
}
