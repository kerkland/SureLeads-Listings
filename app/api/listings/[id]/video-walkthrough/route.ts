import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import { notificationQueue } from '@/lib/queue';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(req, ['AGENT'], async (user) => {
    const listingId = params.id;
    const body = await req.json();
    const { cloudinaryUrl, cloudinaryPublicId, durationSeconds } = body;

    if (!cloudinaryUrl || !cloudinaryPublicId) {
      return NextResponse.json(
        { success: false, error: 'cloudinaryUrl and cloudinaryPublicId are required' },
        { status: 400 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true, agentId: true, tier: true },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }
    if (listing.agentId !== user.sub) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    if (listing.tier !== 'VERIFIED') {
      return NextResponse.json(
        { success: false, error: 'Video walkthrough only applies to VERIFIED listings' },
        { status: 400 }
      );
    }

    // Upsert: agent may re-upload after rejection
    const walkthrough = await prisma.videoWalkthrough.upsert({
      where: { listingId },
      create: {
        listingId,
        cloudinaryUrl,
        cloudinaryPublicId,
        durationSeconds: durationSeconds ?? null,
        status: 'PENDING_REVIEW',
      },
      update: {
        cloudinaryUrl,
        cloudinaryPublicId,
        durationSeconds: durationSeconds ?? null,
        status: 'PENDING_REVIEW',
        reviewedAt: null,
        reviewedBy: null,
        rejectionReason: null,
        uploadedAt: new Date(),
      },
    });

    // Notify admins via in-app notification (type handled by notification worker)
    await notificationQueue.add('send', {
      type: 'ADMIN_VIDEO_REVIEW_NEEDED',
      listingId,
      walkthroughId: walkthrough.id,
    });

    return NextResponse.json({ success: true, data: walkthrough }, { status: 201 });
  });
}
