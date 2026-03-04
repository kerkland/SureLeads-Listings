/**
 * GET /api/admin/analytics
 * Aggregated platform analytics: time-series + breakdowns.
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

function weekLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getWeekBuckets(weeks = 8) {
  const buckets: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = weeks - 1; i >= 0; i--) {
    const end   = new Date(now);
    end.setDate(end.getDate() - i * 7);
    end.setHours(23, 59, 59, 999);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    buckets.push({ label: weekLabel(start), start, end });
  }
  return buckets;
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const buckets = getWeekBuckets(8);
    const earliest = buckets[0].start;

    // Fetch all relevant records in one pass each
    const [listings, agents, complaints] = await Promise.all([
      prisma.listing.findMany({
        where:  { createdAt: { gte: earliest }, deletedAt: null },
        select: { createdAt: true, category: true, area: true },
      }),
      prisma.user.findMany({
        where:  { role: 'AGENT', createdAt: { gte: earliest }, deletedAt: null },
        select: { createdAt: true },
      }),
      prisma.complaint.findMany({
        where:  { createdAt: { gte: earliest } },
        select: { createdAt: true },
      }),
    ]);

    // Group into weekly buckets
    function bucketize(items: { createdAt: Date }[]) {
      return buckets.map((b) => ({
        label: b.label,
        count: items.filter((i) => i.createdAt >= b.start && i.createdAt <= b.end).length,
      }));
    }

    const listingsByWeek    = bucketize(listings);
    const agentsByWeek      = bucketize(agents);
    const complaintsByWeek  = bucketize(complaints);

    // Listings by category (all time active)
    const catGroups = await prisma.listing.groupBy({
      by:     ['category'],
      where:  { deletedAt: null },
      _count: { id: true },
    });
    const listingsByCategory = catGroups.map((g) => ({ category: g.category, count: g._count.id }));

    // Top 10 areas by listing count
    const areaGroups = await prisma.listing.groupBy({
      by:     ['area'],
      where:  { deletedAt: null },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take:   10,
    });
    const listingsByArea = areaGroups.map((g) => ({ area: g.area, count: g._count.id }));

    // Agents by subscription tier
    const tierGroups = await prisma.agentProfile.groupBy({
      by:     ['subscriptionTier'],
      _count: { id: true },
    });
    const agentsByTier = tierGroups.map((g) => ({ tier: g.subscriptionTier, count: g._count.id }));

    // Summary stats
    const [totalListings, totalAgents, totalUsers, activeListings, totalReviews] = await Promise.all([
      prisma.listing.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { role: 'AGENT', deletedAt: null } }),
      prisma.user.count({ where: { role: 'CLIENT', deletedAt: null } }),
      prisma.listing.count({ where: { deletedAt: null, status: 'AVAILABLE' } }),
      prisma.review.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: { totalListings, totalAgents, totalUsers, activeListings, totalReviews },
        listingsByWeek,
        agentsByWeek,
        complaintsByWeek,
        listingsByCategory,
        listingsByArea,
        agentsByTier,
      },
    });
  });
}
