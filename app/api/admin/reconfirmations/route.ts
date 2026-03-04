/**
 * GET /api/admin/reconfirmations
 * Paginated listing reconfirmation oversight.
 *
 * Query params:
 *   tab:   'due-soon' | 'grace' | 'hidden'
 *   page, limit
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

function fmtDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const tab   = searchParams.get('tab')   ?? 'due-soon';
    const page  = parseInt(searchParams.get('page')  ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '25');
    const skip  = (page - 1) * limit;

    const now   = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: Record<string, any> = { deletedAt: null };

    if (tab === 'due-soon') {
      where = {
        ...where,
        tier:                  'VERIFIED',
        status:                { in: ['AVAILABLE', 'PENDING_RECONFIRMATION'] },
        nextReconfirmationDue: { gte: now, lte: in48h },
      };
    } else if (tab === 'grace') {
      where = {
        ...where,
        status:         'HIDDEN',
        graceExpiresAt: { not: null, gt: now },
      };
    } else {
      // All hidden listings (missed reconfirmation)
      where = {
        ...where,
        status:  'HIDDEN',
        hiddenAt: { not: null },
      };
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          agent: { select: { fullName: true, phone: true } },
        },
        orderBy: tab === 'due-soon'
          ? { nextReconfirmationDue: 'asc' }
          : tab === 'grace'
          ? { graceExpiresAt: 'asc' }
          : { hiddenAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    const data = listings.map((l) => ({
      id:                        l.id,
      title:                     l.title,
      area:                      l.area,
      city:                      l.city,
      propertyType:              l.propertyType,
      status:                    l.status,
      tier:                      l.tier,
      nextReconfirmationDue:     fmtDate(l.nextReconfirmationDue),
      graceExpiresAt:            fmtDate(l.graceExpiresAt),
      hiddenAt:                  fmtDate(l.hiddenAt),
      reconfirmationMissedCount: l.reconfirmationMissedCount,
      agentName:                 l.agent.fullName,
      agentPhone:                l.agent.phone,
    }));

    // Tab counts for badge display
    const [dueSoonCount, graceCount, hiddenCount] = await Promise.all([
      prisma.listing.count({
        where: { deletedAt: null, tier: 'VERIFIED', status: { in: ['AVAILABLE', 'PENDING_RECONFIRMATION'] }, nextReconfirmationDue: { gte: now, lte: in48h } },
      }),
      prisma.listing.count({
        where: { deletedAt: null, status: 'HIDDEN', graceExpiresAt: { not: null, gt: now } },
      }),
      prisma.listing.count({
        where: { deletedAt: null, status: 'HIDDEN', hiddenAt: { not: null } },
      }),
    ]);

    return NextResponse.json({
      success: true, data, total, page,
      totalPages: Math.ceil(total / limit),
      tabCounts: { dueSoon: dueSoonCount, grace: graceCount, hidden: hiddenCount },
    });
  });
}
