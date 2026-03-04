/**
 * GET /api/user/dashboard
 *
 * Returns dashboard data for a signed-in CLIENT:
 *  - Summary counts (total / upcoming / completed inspections, reviews written)
 *  - Upcoming inspections (REQUESTED + CONFIRMED)
 *  - Past inspections (last 5: COMPLETED / CANCELLED / NO_SHOW)
 *  - Recent reviews written (last 5)
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['CLIENT', 'AGENT'], async (user) => {
    const userId = user.sub;

    const [inspections, reviews] = await Promise.all([
      prisma.inspection.findMany({
        where: { clientId: userId },
        orderBy: { requestedAt: 'desc' },
        take: 30,
        select: {
          id:                true,
          status:            true,
          proposedDate:      true,
          confirmedDate:     true,
          requestedAt:       true,
          completedAt:       true,
          cancelledAt:       true,
          inspectionFeeKobo: true,
          listing: {
            select: {
              id:           true,
              title:        true,
              area:         true,
              city:         true,
              photos:       true,
              propertyType: true,
              bedrooms:     true,
            },
          },
          agent: {
            select: {
              id:              true,
              agencyName:      true,
              profilePhoto:    true,
              isVerifiedBadge: true,
              user: { select: { fullName: true } },
            },
          },
          review: { select: { id: true } },
        },
      }),
      prisma.review.findMany({
        where: { reviewerId: userId, isFlagged: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id:        true,
          rating:    true,
          body:      true,
          createdAt: true,
          listing: {
            select: { id: true, title: true, area: true, city: true },
          },
          agent: {
            select: {
              agencyName: true,
              user: { select: { fullName: true } },
            },
          },
        },
      }),
    ]);

    const upcoming = inspections.filter((i) =>
      i.status === 'REQUESTED' || i.status === 'CONFIRMED',
    );
    const past = inspections
      .filter((i) =>
        i.status === 'COMPLETED' ||
        i.status === 'CANCELLED' ||
        i.status === 'NO_SHOW',
      )
      .slice(0, 5);

    // BigInt → string for JSON serialisation
    const serialise = (i: typeof inspections[number]) => ({
      ...i,
      inspectionFeeKobo: i.inspectionFeeKobo.toString(),
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalInspections:    inspections.length,
          upcomingInspections: upcoming.length,
          completedInspections: inspections.filter((i) => i.status === 'COMPLETED').length,
          reviewsWritten:      reviews.length,
        },
        upcomingInspections: upcoming.map(serialise),
        pastInspections:     past.map(serialise),
        recentReviews:       reviews,
      },
    });
  });
}
