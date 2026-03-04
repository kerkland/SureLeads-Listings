/**
 * GET /api/admin/subscriptions
 * Paginated agent subscription list for admin management.
 *
 * Query params:
 *   tier: 'STARTER' | 'PROFESSIONAL' | 'AGENCY' | '' (all)
 *   page, limit
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const tier  = searchParams.get('tier')  ?? '';
    const page  = parseInt(searchParams.get('page')  ?? '1');
    const limit = parseInt(searchParams.get('limit') ?? '25');
    const skip  = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { user: { deletedAt: null } };
    if (['STARTER', 'PROFESSIONAL', 'AGENCY'].includes(tier)) {
      where.subscriptionTier = tier;
    }

    const [profiles, total] = await Promise.all([
      prisma.agentProfile.findMany({
        where,
        include: {
          user: {
            select: { id: true, fullName: true, phone: true, email: true, isSuspended: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.agentProfile.count({ where }),
    ]);

    // Batch listing counts
    const agentUserIds  = profiles.map((p) => p.user.id);
    const listingCounts = await prisma.listing.groupBy({
      by:     ['agentId'],
      where:  { agentId: { in: agentUserIds }, deletedAt: null },
      _count: { id: true },
    });
    const countMap = new Map(listingCounts.map((r) => [r.agentId, r._count.id]));

    const data = profiles.map((p) => ({
      agentId:               p.id,
      userId:                p.user.id,
      fullName:              p.user.fullName,
      phone:                 p.user.phone,
      email:                 p.user.email,
      agencyName:            p.agencyName,
      subscriptionTier:      p.subscriptionTier,
      subscriptionExpiresAt: p.subscriptionExpiresAt,
      listingCount:          countMap.get(p.user.id) ?? 0,
      isVerifiedBadge:       p.isVerifiedBadge,
      isSuspended:           p.user.isSuspended,
      createdAt:             p.createdAt,
    }));

    // Overall tier distribution (ignore page filter)
    const tierCounts = await prisma.agentProfile.groupBy({
      by:    ['subscriptionTier'],
      where: { user: { deletedAt: null } },
      _count: { id: true },
    });
    const tierSummary = Object.fromEntries(
      tierCounts.map((t) => [t.subscriptionTier, t._count.id]),
    );

    return NextResponse.json({
      success: true, data, total, page, limit,
      totalPages: Math.ceil(total / limit),
      tierSummary,
    });
  });
}
