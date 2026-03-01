import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { credibilityQueue } from '@/lib/queue';

export async function POST(req: NextRequest) {
  return withAuth(req, ['CLIENT'], async (user) => {
    const body = await req.json();
    const { agentId, listingId, inspectionId, category, description } = body;

    if (!agentId || !category || !description) {
      return NextResponse.json(
        { success: false, error: 'agentId, category, and description are required' },
        { status: 400 }
      );
    }

    const complaint = await prisma.complaint.create({
      data: {
        complainantId: user.sub,
        agentId,
        listingId: listingId ?? null,
        inspectionId: inspectionId ?? null,
        category,
        description,
      },
    });

    await credibilityQueue.add(
      'recalculate',
      { agentId },
      { jobId: `credibility-${agentId}` }
    );

    return NextResponse.json({ success: true, data: complaint }, { status: 201 });
  });
}
