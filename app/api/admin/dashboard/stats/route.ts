import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const [
      totalListings, verifiedListings, basicListings,
      pendingVideos, openComplaints, suspendedAgents, hiddenListings,
    ] = await Promise.all([
      prisma.listing.count({ where: { deletedAt: null } }),
      prisma.listing.count({ where: { tier: 'VERIFIED', deletedAt: null } }),
      prisma.listing.count({ where: { tier: 'BASIC', deletedAt: null } }),
      prisma.videoWalkthrough.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.complaint.count({ where: { status: { in: ['OPEN', 'UNDER_REVIEW'] } } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.listing.count({ where: { status: 'HIDDEN', deletedAt: null } }),
    ]);

    return NextResponse.json({
      success: true,
      data: { totalListings, verifiedListings, basicListings, pendingVideos, openComplaints, suspendedAgents, hiddenListings },
    });
  });
}
