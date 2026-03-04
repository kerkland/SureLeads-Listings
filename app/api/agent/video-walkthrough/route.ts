/**
 * POST /api/agent/video-walkthrough
 * Agent submits a YouTube URL as a video walkthrough for one of their listings.
 *
 * Body: { listingId: string; youtubeUrl: string }
 *
 * DELETE /api/agent/video-walkthrough?listingId=xxx
 * Agent removes their video walkthrough.
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

/* ── YouTube URL helper ─────────────────────────────────────────────────── */

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/* ── POST ───────────────────────────────────────────────────────────────── */

const postSchema = z.object({
  listingId:  z.string().min(1),
  youtubeUrl: z.string().url().refine(
    (u) => extractYoutubeId(u) !== null,
    { message: 'Must be a valid YouTube video URL' },
  ),
});

export async function POST(req: NextRequest) {
  return withAuth(req, ['AGENT'], async (user) => {
    const body   = await req.json();
    const parsed = postSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { listingId, youtubeUrl } = parsed.data;
    const youtubeId = extractYoutubeId(youtubeUrl)!;

    // Verify listing belongs to this agent
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, agentId: user.id, deletedAt: null },
    });
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Upsert: if a walkthrough exists, replace it (reset to PENDING_REVIEW)
    const existing = await prisma.videoWalkthrough.findUnique({ where: { listingId } });

    if (existing) {
      const updated = await prisma.videoWalkthrough.update({
        where: { listingId },
        data:  {
          cloudinaryUrl:      youtubeUrl,
          cloudinaryPublicId: youtubeId,
          status:             'PENDING_REVIEW',
          reviewedAt:         null,
          reviewedBy:         null,
          rejectionReason:    null,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const created = await prisma.videoWalkthrough.create({
      data: {
        listingId,
        cloudinaryUrl:      youtubeUrl,
        cloudinaryPublicId: youtubeId,
        status:             'PENDING_REVIEW',
      },
    });

    return NextResponse.json({ success: true, data: created });
  });
}

/* ── DELETE ─────────────────────────────────────────────────────────────── */

export async function DELETE(req: NextRequest) {
  return withAuth(req, ['AGENT'], async (user) => {
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get('listingId');
    if (!listingId) {
      return NextResponse.json({ success: false, error: 'listingId required' }, { status: 400 });
    }

    // Verify listing belongs to this agent
    const listing = await prisma.listing.findFirst({
      where: { id: listingId, agentId: user.id, deletedAt: null },
    });
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    await prisma.videoWalkthrough.deleteMany({ where: { listingId } });

    return NextResponse.json({ success: true });
  });
}
