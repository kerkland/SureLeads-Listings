/**
 * GET /api/admin/reviews
 * Paginated review list for moderation.
 *
 * Query params:
 *   filter: 'all' | 'flagged'
 *   page, limit
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') ?? 'all';
    const page   = parseInt(searchParams.get('page')  ?? '1');
    const limit  = parseInt(searchParams.get('limit') ?? '25');
    const skip   = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};
    if (filter === 'flagged') where.isFlagged = true;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          reviewer: { select: { fullName: true, phone: true } },
          agent:    { select: { agencyName: true, user: { select: { fullName: true } } } },
          listing:  { select: { title: true, area: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const flaggedTotal = filter === 'flagged' ? total : await prisma.review.count({ where: { isFlagged: true } });

    const data = reviews.map((r) => ({
      id:             r.id,
      rating:         r.rating,
      body:           r.body,
      isFlagged:      r.isFlagged,
      flaggedReason:  r.flaggedReason,
      flaggedAt:      r.flaggedAt,
      createdAt:      r.createdAt,
      reviewerName:   r.reviewer.fullName,
      reviewerPhone:  r.reviewer.phone,
      agentName:      r.agent.user.fullName,
      agencyName:     r.agent.agencyName,
      listingTitle:   r.listing.title,
      listingArea:    r.listing.area,
    }));

    return NextResponse.json({
      success: true, data, total, page,
      totalPages:   Math.ceil(total / limit),
      flaggedTotal,
    });
  });
}
