import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { buildBreakdown } from '@/lib/credibilityService';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const agent = await prisma.agentProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, fullName: true, createdAt: true } },
      reviewsReceived: {
        where: { isFlagged: false },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { reviewer: { select: { fullName: true } } },
      },
      _count: {
        select: {
          reviewsReceived: { where: { isFlagged: false } },
          inspectionsAsAgent: { where: { status: 'COMPLETED' } },
        },
      },
    },
  });

  if (!agent) {
    return NextResponse.json({ success: false, error: 'Agent not found' }, { status: 404 });
  }

  const breakdown = buildBreakdown(agent);

  return NextResponse.json({
    success: true,
    data: {
      id: agent.id,
      fullName: agent.user.fullName,
      agencyName: agent.agencyName,
      primaryCity: agent.primaryCity,
      servedCities: agent.servedCities,
      bio: agent.bio,
      profilePhoto: agent.profilePhoto,
      isVerifiedBadge: agent.isVerifiedBadge,
      credibilityScore: agent.credibilityScore,
      credibilityTier: agent.credibilityTier,
      credibilityBreakdown: breakdown,
      memberSince: agent.user.createdAt,
      reviewCount: agent._count.reviewsReceived,
      completedInspections: agent._count.inspectionsAsAgent,
      recentReviews: agent.reviewsReceived,
    },
  });
}
