/**
 * GET /api/admin/agents
 * Paginated agent list for admin management.
 *
 * Query params:
 *   filter: 'all' | 'suspended' | 'unverified'
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
    const limit  = parseInt(searchParams.get('limit') ?? '30');
    const skip   = (page - 1) * limit;

    // Build AgentProfile where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      user: { deletedAt: null },
    };

    if (filter === 'suspended')  where.user            = { ...where.user, isSuspended: true };
    if (filter === 'unverified') where.isVerifiedBadge = false;

    const [profiles, total] = await Promise.all([
      prisma.agentProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id:          true,
              fullName:    true,
              phone:       true,
              isSuspended: true,
              suspendedAt: true,
            },
          },
        },
        orderBy: { credibilityScore: 'desc' },
        skip,
        take: limit,
      }),
      prisma.agentProfile.count({ where }),
    ]);

    // Get listing counts in a single batch query
    const agentUserIds = profiles.map((p) => p.user.id);
    const listingCounts = await prisma.listing.groupBy({
      by:     ['agentId'],
      where:  { agentId: { in: agentUserIds }, deletedAt: null },
      _count: { id: true },
    });
    const countMap = new Map(listingCounts.map((r) => [r.agentId, r._count.id]));

    const data = profiles.map((p) => ({
      id:               p.id,
      userId:           p.user.id,
      fullName:         p.user.fullName,
      phone:            p.user.phone,
      agencyName:       p.agencyName,
      primaryCity:      p.primaryCity,
      subscriptionTier: p.subscriptionTier,
      credibilityScore: p.credibilityScore,
      credibilityTier:  p.credibilityTier,
      scoreOverride:    p.scoreOverride,
      isVerifiedBadge:  p.isVerifiedBadge,
      isSuspended:      p.user.isSuspended,
      suspendedAt:      p.user.suspendedAt,
      listingCount:     countMap.get(p.user.id) ?? 0,
      createdAt:        p.createdAt,
    }));

    return NextResponse.json({ success: true, data, total, page, limit });
  });
}
