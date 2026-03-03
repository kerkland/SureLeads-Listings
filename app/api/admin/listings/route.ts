/**
 * GET /api/admin/listings
 * Paginated listing review queue with suspicious price detection.
 *
 * Query params:
 *   filter: 'all' | 'flagged' | 'suspicious' | 'hidden'
 *   page, limit
 */
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';

const HARD_MIN_KOBO = BigInt(50_000 * 100);        // ₦50k
const HARD_MAX_KOBO = BigInt(500_000_000 * 100);   // ₦500M

function detectSuspicious(
  rentPerYear: bigint,
  median: bigint | undefined,
): { isSuspicious: boolean; suspiciousReason: string } {
  if (rentPerYear < HARD_MIN_KOBO) {
    return { isSuspicious: true, suspiciousReason: 'Below minimum (₦50k)' };
  }
  if (rentPerYear > HARD_MAX_KOBO) {
    return { isSuspicious: true, suspiciousReason: 'Above maximum (₦500M)' };
  }
  if (median) {
    const medN = Number(median);
    const rent = Number(rentPerYear);
    if (rent > medN * 3) {
      return { isSuspicious: true, suspiciousReason: `${Math.round(rent / medN)}× above area median` };
    }
    if (rent < medN * 0.3) {
      return { isSuspicious: true, suspiciousReason: `${Math.round((1 - rent / medN) * 100)}% below area median` };
    }
  }
  return { isSuspicious: false, suspiciousReason: '' };
}

export async function GET(req: NextRequest) {
  return withAuth(req, ['ADMIN'], async () => {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get('filter') ?? 'all';
    const page   = parseInt(searchParams.get('page')  ?? '1');
    const limit  = parseInt(searchParams.get('limit') ?? '30');
    const skip   = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseWhere: Record<string, any> = { deletedAt: null };
    if (filter === 'flagged') baseWhere.isAdminFlagged = true;
    if (filter === 'hidden')  baseWhere.status = 'HIDDEN';

    /* ── Suspicious filter: must count across ALL listings, not just one page ── */
    if (filter === 'suspicious') {
      // Fetch all candidates (no pagination) with only fields needed for detection
      const allListings = await prisma.listing.findMany({
        where: baseWhere,
        include: {
          agent: {
            select: {
              fullName:     true,
              agentProfile: { select: { id: true, agencyName: true, credibilityTier: true, credibilityScore: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Batch-fetch area price indices
      const areaKeySet = new Set(allListings.map((l) => `${l.city}|${l.area}|${l.propertyType}|${l.bedrooms}`));
      const areaKeys   = Array.from(areaKeySet);
      const indices    = await prisma.areaPriceIndex.findMany({
        where: {
          isPublished: true,
          OR: areaKeys.map((k) => {
            const [city, area, propertyType, bedroomsStr] = k.split('|');
            return { city, area, propertyType: propertyType as never, bedrooms: parseInt(bedroomsStr) };
          }),
        },
        select: { city: true, area: true, propertyType: true, bedrooms: true, medianRentPerYear: true },
      });

      const indexMap = new Map(
        indices.map((i) => [`${i.city}|${i.area}|${i.propertyType}|${i.bedrooms}`, i.medianRentPerYear]),
      );

      // Detect and filter suspicious across ALL listings
      const allSuspicious = allListings
        .map((l) => {
          const median = indexMap.get(`${l.city}|${l.area}|${l.propertyType}|${l.bedrooms}`);
          const { isSuspicious, suspiciousReason } = detectSuspicious(l.rentPerYear, median);
          return {
            ...l,
            rentPerYear:     l.rentPerYear.toString(),
            inspectionFee:   l.inspectionFee.toString(),
            isSuspicious,
            suspiciousReason,
          };
        })
        .filter((l) => l.isSuspicious);

      // Now paginate the already-filtered suspicious set
      const suspiciousTotal = allSuspicious.length;
      const data = allSuspicious.slice(skip, skip + limit);

      return NextResponse.json({ success: true, data, total: suspiciousTotal, page, limit });
    }

    /* ── Standard paginated path (all / flagged / hidden) ── */
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where: baseWhere,
        include: {
          agent: {
            select: {
              fullName:     true,
              agentProfile: { select: { id: true, agencyName: true, credibilityTier: true, credibilityScore: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where: baseWhere }),
    ]);

    // Area price indices for this page only
    const areaKeySet = new Set(listings.map((l) => `${l.city}|${l.area}|${l.propertyType}|${l.bedrooms}`));
    const areaKeys   = Array.from(areaKeySet);
    const indices    = await prisma.areaPriceIndex.findMany({
      where: {
        isPublished: true,
        OR: areaKeys.map((k) => {
          const [city, area, propertyType, bedroomsStr] = k.split('|');
          return { city, area, propertyType: propertyType as never, bedrooms: parseInt(bedroomsStr) };
        }),
      },
      select: { city: true, area: true, propertyType: true, bedrooms: true, medianRentPerYear: true },
    });

    const indexMap = new Map(
      indices.map((i) => [`${i.city}|${i.area}|${i.propertyType}|${i.bedrooms}`, i.medianRentPerYear]),
    );

    const data = listings.map((l) => {
      const median = indexMap.get(`${l.city}|${l.area}|${l.propertyType}|${l.bedrooms}`);
      const { isSuspicious, suspiciousReason } = detectSuspicious(l.rentPerYear, median);
      return {
        ...l,
        rentPerYear:   l.rentPerYear.toString(),
        inspectionFee: l.inspectionFee.toString(),
        isSuspicious,
        suspiciousReason,
      };
    });

    return NextResponse.json({ success: true, data, total, page, limit });
  });
}
