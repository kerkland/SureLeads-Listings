import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';
import { priceIndexQueue } from '@/lib/queue';

type Ctx = { params: Record<string, string> };

function serialize(obj: Record<string, unknown>) {
  return {
    ...obj,
    rentPerYear: obj.rentPerYear?.toString(),
    inspectionFee: obj.inspectionFee?.toString(),
  };
}

// ─── GET /api/listings/[id] ───────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Ctx) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        agent: {
          select: {
            id: true,
            fullName: true,
            agentProfile: {
              select: {
                id: true,
                agencyName: true,
                profilePhoto: true,
                reputationScore: true,
                credibilityScore: true,
                credibilityTier: true,
                isVerifiedBadge: true,
                primaryCity: true,
                bio: true,
              },
            },
          },
        },
        reviews: { select: { rating: true }, where: { listing: { deletedAt: null }, isFlagged: false } },
        videoWalkthrough: { select: { status: true, cloudinaryUrl: true, durationSeconds: true } },
        _count: { select: { inspections: true } },
      },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    prisma.listing
      .update({ where: { id: params.id }, data: { viewsCount: { increment: 1 } } })
      .catch(() => {});

    const avgRating =
      listing.reviews.length > 0
        ? listing.reviews.reduce((s, r) => s + r.rating, 0) / listing.reviews.length
        : null;

    // Only expose video URL if admin-approved
    const videoWalkthrough =
      listing.videoWalkthrough?.status === 'APPROVED'
        ? listing.videoWalkthrough
        : listing.videoWalkthrough
        ? { status: listing.videoWalkthrough.status }
        : null;

    return NextResponse.json({
      success: true,
      data: {
        ...serialize(listing as unknown as Record<string, unknown>),
        avgRating,
        reviews: undefined,
        videoWalkthrough,
        inspectionCount: listing._count.inspections,
      },
    });
  } catch (err) {
    console.error('[GET /listings/id]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PATCH /api/listings/[id] ─────────────────────────────────────────────────

const updateSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(20).max(2000).optional(),
  bedrooms: z.number().int().min(0).max(20).optional(),
  bathrooms: z.number().int().min(0).max(20).optional(),
  addressLine: z.string().min(5).max(300).optional(),
  area: z.string().min(2).max(100).optional(),
  city: z.string().min(2).max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  rentPerYear: z.number().int().positive().optional(),
  inspectionFee: z.number().int().positive().optional(),
  photos: z.array(z.string().url()).min(1).max(10).optional(),
  photoHashes: z.array(z.string()).optional(),
});

export const PATCH = withAuth(async (req: AuthenticatedRequest, { params }: Ctx) => {
  try {
    const listing = await prisma.listing.findUnique({ where: { id: params.id, deletedAt: null } });
    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }
    if (listing.agentId !== req.user.sub) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        ...data,
        ...(data.rentPerYear ? { rentPerYear: BigInt(data.rentPerYear) } : {}),
        ...(data.inspectionFee ? { inspectionFee: BigInt(data.inspectionFee) } : {}),
      },
    });

    // Trigger price index recalc if rentPerYear changed on a VERIFIED AVAILABLE listing
    if (
      data.rentPerYear &&
      updated.tier === 'VERIFIED' &&
      updated.status === 'AVAILABLE'
    ) {
      await priceIndexQueue.add(
        'recalculate',
        {
          city: updated.city,
          area: updated.area,
          propertyType: updated.propertyType,
          bedrooms: updated.bedrooms,
        },
        {
          jobId: `price-index-${updated.city}-${updated.area}-${updated.propertyType}-${updated.bedrooms}`,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: serialize(updated as unknown as Record<string, unknown>),
    });
  } catch (err) {
    console.error('[PATCH /listings/id]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['AGENT']);

// ─── DELETE /api/listings/[id] ────────────────────────────────────────────────

export const DELETE = withAuth(async (req: AuthenticatedRequest, { params }: Ctx) => {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id: params.id, deletedAt: null },
    });

    if (!listing) {
      return NextResponse.json({ success: false, error: 'Listing not found' }, { status: 404 });
    }

    const isOwner = listing.agentId === req.user.sub;
    const isAdmin = req.user.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await prisma.listing.update({
      where: { id: params.id },
      data: { deletedAt: new Date(), status: 'DELETED' },
    });

    // Trigger price index recalc if this was a VERIFIED AVAILABLE listing
    if (listing.tier === 'VERIFIED' && listing.status === 'AVAILABLE') {
      await priceIndexQueue.add(
        'recalculate',
        {
          city: listing.city,
          area: listing.area,
          propertyType: listing.propertyType,
          bedrooms: listing.bedrooms,
        },
        {
          jobId: `price-index-${listing.city}-${listing.area}-${listing.propertyType}-${listing.bedrooms}`,
        }
      );
    }

    return NextResponse.json({ success: true, message: 'Listing deleted' });
  } catch (err) {
    console.error('[DELETE /listings/id]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['AGENT', 'ADMIN']);
