import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

export async function POST(req: NextRequest) {
  return withAuth(req, ['CLIENT'], async (user) => {
    const body = await req.json();
    const { listingId, agentId, inspectionId, rating, body: reviewBody } = body;

    if (!listingId || !agentId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { success: false, error: 'listingId, agentId, and rating (1-5) are required' },
        { status: 400 }
      );
    }

    // Validate inspection if provided
    if (inspectionId) {
      const inspection = await prisma.inspection.findUnique({
        where: { id: inspectionId },
        select: { clientId: true, status: true, review: true },
      });
      if (!inspection || inspection.clientId !== user.sub) {
        return NextResponse.json({ success: false, error: 'Inspection not found' }, { status: 404 });
      }
      if (inspection.status !== 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Inspection must be COMPLETED before reviewing' },
          { status: 400 }
        );
      }
      if (inspection.review) {
        return NextResponse.json(
          { success: false, error: 'Review already submitted for this inspection' },
          { status: 409 }
        );
      }
    }

    const review = await prisma.review.create({
      data: {
        reviewerId: user.sub,
        agentId,
        listingId,
        inspectionId: inspectionId ?? null,
        rating,
        body: reviewBody ?? null,
      },
    });

    await credibilityQueue.add(
      'recalculate',
      { agentId },
      { jobId: `credibility-${agentId}` }
    );

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  });
}
