import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';
import { crossPostQueue, priceIndexQueue } from '@/lib/queue';

// ─── POST /api/listings ───────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(2000),
  propertyType: z.enum(['FLAT', 'DUPLEX', 'ROOM', 'BUNGALOW', 'TERRACED']),
  bedrooms: z.number().int().min(0).max(20),
  bathrooms: z.number().int().min(0).max(20),
  addressLine: z.string().min(5).max(300),
  area: z.string().min(2).max(100),
  city: z.string().min(2).max(100),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  rentPerYear: z.number().int().positive(), // kobo
  inspectionFee: z.number().int().positive(), // kobo
  photos: z.array(z.string().url()).min(1).max(10),
  photoHashes: z.array(z.string()).default([]),
  tier: z.enum(['BASIC', 'VERIFIED']).default('BASIC'),
});

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { tier, ...rest } = parsed.data;

    const listing = await prisma.listing.create({
      data: {
        ...rest,
        tier,
        rentPerYear: BigInt(rest.rentPerYear),
        inspectionFee: BigInt(rest.inspectionFee),
        agentId: req.user.sub,
        // VERIFIED listings start with no reconfirmation clock — set after video approval
        nextReconfirmationDue: null,
      },
    });

    // Trigger cross-posting detection async
    await crossPostQueue.add('detect', { listingId: listing.id });

    return NextResponse.json(
      { success: true, data: serializeListing(listing) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[POST /listings]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}, ['AGENT']);

// ─── GET /api/listings ────────────────────────────────────────────────────────

const searchSchema = z.object({
  city: z.string().optional(),
  area: z.string().optional(),
  bedrooms: z.coerce.number().int().optional(),
  minRent: z.coerce.number().int().optional(),
  maxRent: z.coerce.number().int().optional(),
  propertyType: z.enum(['FLAT', 'DUPLEX', 'ROOM', 'BUNGALOW', 'TERRACED']).optional(),
  tier: z.enum(['BASIC', 'VERIFIED']).optional(),
  sortBy: z.enum(['newest', 'credibility', 'price_asc', 'price_desc']).default('newest'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = searchSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { city, area, bedrooms, minRent, maxRent, propertyType, tier, sortBy, page, limit } =
      parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      status: 'AVAILABLE' as const,
      deletedAt: null,
      ...(city ? { city: { contains: city, mode: 'insensitive' as const } } : {}),
      ...(area ? { area: { contains: area, mode: 'insensitive' as const } } : {}),
      ...(bedrooms !== undefined ? { bedrooms } : {}),
      ...(propertyType ? { propertyType } : {}),
      ...(tier ? { tier } : {}),
      ...(minRent || maxRent
        ? {
            rentPerYear: {
              ...(minRent ? { gte: BigInt(minRent) } : {}),
              ...(maxRent ? { lte: BigInt(maxRent) } : {}),
            },
          }
        : {}),
    };

    const orderBy =
      sortBy === 'price_asc'
        ? { rentPerYear: 'asc' as const }
        : sortBy === 'price_desc'
        ? { rentPerYear: 'desc' as const }
        : sortBy === 'credibility'
        ? { agent: { agentProfile: { credibilityScore: 'desc' as const } } }
        : { createdAt: 'desc' as const };

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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
                },
              },
            },
          },
          videoWalkthrough: { select: { status: true } },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: listings.map(serializeListing),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('[GET /listings]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Serialize BigInt fields for JSON
function serializeListing(listing: Record<string, unknown>) {
  return {
    ...listing,
    rentPerYear: listing.rentPerYear?.toString(),
    inspectionFee: listing.inspectionFee?.toString(),
  };
}
