import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import type { PropertyType, PriceTrend, PriceDataQualityFlag } from '@/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city         = searchParams.get('city');
  const area         = searchParams.get('area');
  const propertyType = searchParams.get('propertyType') as PropertyType | null;
  const bedrooms     = parseInt(searchParams.get('bedrooms') ?? '-1');

  if (!city || !area || !propertyType) {
    return NextResponse.json(
      { success: false, error: 'city, area, and propertyType are required' },
      { status: 400 },
    );
  }

  try {
    // ── Exact match ──
    const index = await prisma.areaPriceIndex.findUnique({
      where: { city_area_propertyType_bedrooms: { city, area, propertyType, bedrooms } },
    });

    if (index?.isPublished) {
      return NextResponse.json({
        success: true,
        data: { available: true, isFallback: false, fallbackLabel: null, ...serializeIndex(index) },
      });
    }

    // ── Bedroom-agnostic fallback (aggregate across all bedroom counts) ──
    if (bedrooms !== -1) {
      const agg = await prisma.areaPriceIndex.findUnique({
        where: { city_area_propertyType_bedrooms: { city, area, propertyType, bedrooms: -1 } },
      });
      if (agg?.isPublished) {
        return NextResponse.json({
          success: true,
          data: {
            available:     true,
            isFallback:    true,
            fallbackLabel: 'Area average (all bedroom types)',
            ...serializeIndex(agg),
          },
        });
      }
    }

    // ── City-level fallback: highest-confidence published index for this city + type ──
    const cityFallback = await prisma.areaPriceIndex.findFirst({
      where:   { city, propertyType, isPublished: true },
      orderBy: { confidenceScore: 'desc' },
    });
    if (cityFallback) {
      return NextResponse.json({
        success: true,
        data: {
          available:     true,
          isFallback:    true,
          fallbackLabel: `${city} city average`,
          ...serializeIndex(cityFallback),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: { available: false, reason: 'insufficient_data' },
    });
  } catch (err) {
    console.error('[GET /api/price-insights]', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// ─── Serializer ───────────────────────────────────────────────────────────────

type IndexRow = {
  city:                      string;
  area:                      string;
  propertyType:              string;
  bedrooms:                  number;
  medianRentPerYear:         bigint;
  p25RentPerYear:            bigint;
  p75RentPerYear:            bigint;
  minRentPerYear:            bigint;
  maxRentPerYear:            bigint;
  listingCount:              number;
  agentCount:                number;
  confidenceScore:           number;
  isDominatedMarket:         boolean;
  dataQualityFlags:          string[];
  trendDirection:            string | null;
  priceChangePercent:        number | null;
  previousMedianRentPerYear: bigint | null;
  calculatedAt:              Date;
};

function serializeIndex(index: IndexRow) {
  return {
    city:                      index.city,
    area:                      index.area,
    propertyType:              index.propertyType as PropertyType,
    bedrooms:                  index.bedrooms,
    medianRentPerYear:         Number(index.medianRentPerYear),
    p25RentPerYear:            Number(index.p25RentPerYear),
    p75RentPerYear:            Number(index.p75RentPerYear),
    minRentPerYear:            Number(index.minRentPerYear),
    maxRentPerYear:            Number(index.maxRentPerYear),
    listingCount:              index.listingCount,
    agentCount:                index.agentCount,
    confidenceScore:           index.confidenceScore,
    isDominatedMarket:         index.isDominatedMarket,
    dataQualityFlags:          index.dataQualityFlags as PriceDataQualityFlag[],
    trendDirection:            (index.trendDirection ?? null) as PriceTrend | null,
    priceChangePercent:        index.priceChangePercent,
    previousMedianRentPerYear: index.previousMedianRentPerYear !== null
      ? Number(index.previousMedianRentPerYear)
      : null,
    calculatedAt:              index.calculatedAt.toISOString(),
  };
}
