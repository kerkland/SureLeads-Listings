import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { AuthenticatedRequest } from '@/lib/middleware';
import { crossPostQueue, priceIndexQueue } from '@/lib/queue';

// ─── POST /api/listings ───────────────────────────────────────────────────────

const createSchema = z.object({
  category: z.enum(['FOR_RENT', 'FOR_SALE', 'SHORT_LET']).default('FOR_RENT'),
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
  photos: z.array(z.string().min(1)).min(4).max(15),
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
  category: z.enum(['FOR_RENT', 'FOR_SALE', 'SHORT_LET']).optional(),
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

    const { category, city, area, bedrooms, minRent, maxRent, propertyType, tier, sortBy, page, limit } =
      parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      status: 'AVAILABLE' as const,
      deletedAt: null,
      ...(category ? { category } : {}),
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

    // Shared include block used by both code paths
    const listingInclude = {
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
    } as const;

    let listings: Awaited<ReturnType<typeof prisma.listing.findMany>>;
    let total: number;

    if (sortBy === 'credibility') {
      // ── Composite rank: credibilityScore × tierMultiplier ─────────────────
      // VERIFIED listings get full weight (×1.0), BASIC get ×0.6
      // Agents with no profile default to score 0 (LEFT JOIN + COALESCE)
      const sqlConditions: Prisma.Sql[] = [
        Prisma.sql`l.status = 'AVAILABLE'`,
        Prisma.sql`l."deletedAt" IS NULL`,
      ];
      if (category)      sqlConditions.push(Prisma.sql`l.category::text = ${category}`);
      if (city)          sqlConditions.push(Prisma.sql`l.city ILIKE ${'%' + city + '%'}`);
      if (area)          sqlConditions.push(Prisma.sql`l.area ILIKE ${'%' + area + '%'}`);
      if (bedrooms !== undefined) sqlConditions.push(Prisma.sql`l.bedrooms = ${bedrooms}`);
      if (propertyType)  sqlConditions.push(Prisma.sql`l."propertyType"::text = ${propertyType}`);
      if (tier)          sqlConditions.push(Prisma.sql`l.tier::text = ${tier}`);
      if (minRent)       sqlConditions.push(Prisma.sql`l."rentPerYear" >= ${BigInt(minRent)}`);
      if (maxRent)       sqlConditions.push(Prisma.sql`l."rentPerYear" <= ${BigInt(maxRent)}`);

      const whereClause = Prisma.join(sqlConditions, ' AND ');

      const [rankedRows, countResult] = await Promise.all([
        prisma.$queryRaw<{ id: string }[]>(
          Prisma.sql`
            SELECT l.id
            FROM   listings l
            LEFT JOIN agent_profiles ap ON ap."userId" = l."agentId"
            WHERE  ${whereClause}
            ORDER BY (
              COALESCE(ap."credibilityScore", 0)::float *
              CASE l.tier::text WHEN 'VERIFIED' THEN 1.0 ELSE 0.6 END
            ) DESC,
            l."createdAt" DESC
            LIMIT  ${limit}
            OFFSET ${skip}
          `
        ),
        prisma.$queryRaw<{ count: bigint }[]>(
          Prisma.sql`
            SELECT COUNT(*) AS count
            FROM   listings l
            WHERE  ${whereClause}
          `
        ),
      ]);

      const idList = rankedRows.map((r) => r.id);
      total = Number(countResult[0]?.count ?? 0);

      const rows = await prisma.listing.findMany({
        where: { id: { in: idList } },
        include: listingInclude,
      });

      // Re-sort to match SQL rank order (findMany result order is not guaranteed)
      const idIndex = new Map(idList.map((id, i) => [id, i]));
      listings = rows.sort((a, b) => (idIndex.get(a.id) ?? 0) - (idIndex.get(b.id) ?? 0));
    } else {
      // ── Standard Prisma orderBy for all other sorts ────────────────────────
      const orderBy =
        sortBy === 'price_asc'
          ? { rentPerYear: 'asc' as const }
          : sortBy === 'price_desc'
          ? { rentPerYear: 'desc' as const }
          : { createdAt: 'desc' as const };

      [listings, total] = await Promise.all([
        prisma.listing.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: listingInclude,
        }),
        prisma.listing.count({ where }),
      ]);
    }

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
