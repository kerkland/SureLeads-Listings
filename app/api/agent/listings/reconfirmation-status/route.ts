/**
 * GET /api/agent/listings/reconfirmation-status
 *
 * Returns all VERIFIED listings for the authenticated agent with full
 * reconfirmation tracking data and a 12-week compliance rate.
 *
 * Sorted: HIDDEN → PENDING_RECONFIRMATION → AVAILABLE (by nextReconfirmationDue asc)
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

const COMPLIANCE_WINDOW_WEEKS = 12;

export async function GET(req: NextRequest) {
  return withAuth(req, ['AGENT'], async (user) => {
    // Fetch all VERIFIED listings for this agent
    const listings = await prisma.listing.findMany({
      where: {
        agentId:   user.sub,
        tier:      'VERIFIED',
        deletedAt: null,
      },
      select: {
        id:                       true,
        title:                    true,
        area:                     true,
        city:                     true,
        status:                   true,
        rentPerYear:              true,
        nextReconfirmationDue:    true,
        lastReconfirmedAt:        true,
        graceExpiresAt:           true,
        reconfirmationMissedCount: true,
      },
    });

    // Sort: HIDDEN first → PENDING_RECONFIRMATION → AVAILABLE, then by due date asc
    const STATUS_ORDER: Record<string, number> = {
      HIDDEN:                 0,
      PENDING_RECONFIRMATION: 1,
      AVAILABLE:              2,
    };

    const sorted = [...listings].sort((a, b) => {
      const orderDiff = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
      if (orderDiff !== 0) return orderDiff;
      // Within same status: sort by nextReconfirmationDue ascending (soonest first)
      const aTime = a.nextReconfirmationDue?.getTime() ?? Infinity;
      const bTime = b.nextReconfirmationDue?.getTime() ?? Infinity;
      return aTime - bTime;
    });

    // Compute 12-week compliance rate
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - COMPLIANCE_WINDOW_WEEKS * 7);

    const records = await prisma.reconfirmationRecord.findMany({
      where: {
        agentId:     user.sub,
        confirmedAt: { gte: windowStart },
      },
      select: { wasOnTime: true },
    });

    const totalRecords  = records.length;
    const onTimeRecords = records.filter((r) => r.wasOnTime).length;
    const complianceRate = totalRecords > 0
      ? Math.round((onTimeRecords / totalRecords) * 100) / 100
      : 1; // default to 100% if no records yet

    // Summary counts
    const summary = {
      hidden:                listings.filter((l) => l.status === 'HIDDEN').length,
      pendingReconfirmation: listings.filter((l) => l.status === 'PENDING_RECONFIRMATION').length,
      available:             listings.filter((l) => l.status === 'AVAILABLE').length,
      total:                 listings.length,
    };

    return NextResponse.json({
      success: true,
      data: {
        listings: sorted.map((l) => ({
          ...l,
          rentPerYear: l.rentPerYear.toString(), // BigInt → string for JSON
        })),
        complianceRate,
        summary,
      },
    });
  });
}
