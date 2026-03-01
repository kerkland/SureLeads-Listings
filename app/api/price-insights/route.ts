import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from '@/lib/middleware';
import type { PropertyType } from '@/types';

export async function GET(req: NextRequest) {
  return withAuth(req, ['AGENT', 'CLIENT'], async () => {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city');
    const area = searchParams.get('area');
    const propertyType = searchParams.get('propertyType') as PropertyType | null;
    const bedrooms = parseInt(searchParams.get('bedrooms') ?? '-1');

    if (!city || !area || !propertyType) {
      return NextResponse.json(
        { success: false, error: 'city, area, and propertyType are required' },
        { status: 400 }
      );
    }

    const index = await prisma.areaPriceIndex.findUnique({
      where: { city_area_propertyType_bedrooms: { city, area, propertyType, bedrooms } },
    });

    if (!index || !index.isPublished) {
      // Try city-level fallback (bedrooms = -1 aggregate)
      const fallback =
        bedrooms !== -1
          ? await prisma.areaPriceIndex.findUnique({
              where: { city_area_propertyType_bedrooms: { city, area, propertyType, bedrooms: -1 } },
            })
          : null;

      if (fallback?.isPublished) {
        return NextResponse.json({
          success: true,
          data: {
            available: true,
            isFallback: true,
            fallbackLabel: 'Area average (all bedroom types)',
            ...serializeIndex(fallback),
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: { available: false, reason: 'insufficient_data' },
      });
    }

    return NextResponse.json({
      success: true,
      data: { available: true, isFallback: false, ...serializeIndex(index) },
    });
  });
}

function serializeIndex(index: {
  city: string;
  area: string;
  propertyType: string;
  bedrooms: number;
  medianRentPerYear: bigint;
  p25RentPerYear: bigint;
  p75RentPerYear: bigint;
  minRentPerYear: bigint;
  maxRentPerYear: bigint;
  listingCount: number;
  confidenceScore: number;
  calculatedAt: Date;
}) {
  return {
    city: index.city,
    area: index.area,
    propertyType: index.propertyType,
    bedrooms: index.bedrooms,
    medianRentPerYear: Number(index.medianRentPerYear),
    p25RentPerYear: Number(index.p25RentPerYear),
    p75RentPerYear: Number(index.p75RentPerYear),
    minRentPerYear: Number(index.minRentPerYear),
    maxRentPerYear: Number(index.maxRentPerYear),
    listingCount: index.listingCount,
    confidenceScore: index.confidenceScore,
    calculatedAt: index.calculatedAt.toISOString(),
  };
}
