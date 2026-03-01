import prisma from './db';
import type { PropertyType } from '@/types';

const MIN_LISTINGS_TO_PUBLISH = 5;
const MAX_CONFIDENCE_LISTINGS = 20;

// ─── Statistics ───────────────────────────────────────────────────────────────

function percentile(sorted: bigint[], p: number): bigint {
  if (sorted.length === 0) return BigInt(0);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const frac = idx - lower;
  return BigInt(
    Math.round(
      Number(sorted[lower]) + frac * (Number(sorted[upper]) - Number(sorted[lower]))
    )
  );
}

function removeOutliers(values: bigint[]): bigint[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const q1 = Number(percentile(sorted, 25));
  const q3 = Number(percentile(sorted, 75));
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return sorted.filter((v) => Number(v) >= lower && Number(v) <= upper);
}

// ─── Core Calculation ─────────────────────────────────────────────────────────

export async function recalculatePriceIndex(params: {
  city: string;
  area: string;
  propertyType: PropertyType;
  bedrooms: number; // -1 for aggregate
}): Promise<void> {
  const { city, area, propertyType, bedrooms } = params;

  const whereClause: Record<string, unknown> = {
    city,
    area,
    propertyType,
    tier: 'VERIFIED',
    status: 'AVAILABLE',
    deletedAt: null,
  };
  if (bedrooms !== -1) {
    whereClause.bedrooms = bedrooms;
  }

  const listings = await prisma.listing.findMany({
    where: whereClause,
    select: { rentPerYear: true },
  });

  const rawValues = listings.map((l) => l.rentPerYear);
  const cleaned = removeOutliers(rawValues);
  const count = cleaned.length;

  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (count === 0) {
    // Upsert with isPublished = false
    await prisma.areaPriceIndex.upsert({
      where: { city_area_propertyType_bedrooms: { city, area, propertyType, bedrooms } },
      create: {
        city, area, propertyType, bedrooms,
        medianRentPerYear: BigInt(0),
        p25RentPerYear: BigInt(0),
        p75RentPerYear: BigInt(0),
        minRentPerYear: BigInt(0),
        maxRentPerYear: BigInt(0),
        listingCount: 0,
        confidenceScore: 0,
        isPublished: false,
        calculatedAt: now,
        nextCalculationDue: nextWeek,
      },
      update: {
        medianRentPerYear: BigInt(0),
        p25RentPerYear: BigInt(0),
        p75RentPerYear: BigInt(0),
        minRentPerYear: BigInt(0),
        maxRentPerYear: BigInt(0),
        listingCount: 0,
        confidenceScore: 0,
        isPublished: false,
        calculatedAt: now,
        nextCalculationDue: nextWeek,
      },
    });
    return;
  }

  const sorted = [...cleaned].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const median = percentile(sorted, 50);
  const p25 = percentile(sorted, 25);
  const p75 = percentile(sorted, 75);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  const confidenceScore = Math.min(1.0, count / MAX_CONFIDENCE_LISTINGS);
  const isPublished = count >= MIN_LISTINGS_TO_PUBLISH;

  await prisma.areaPriceIndex.upsert({
    where: { city_area_propertyType_bedrooms: { city, area, propertyType, bedrooms } },
    create: {
      city, area, propertyType, bedrooms,
      medianRentPerYear: median,
      p25RentPerYear: p25,
      p75RentPerYear: p75,
      minRentPerYear: min,
      maxRentPerYear: max,
      listingCount: count,
      confidenceScore,
      isPublished,
      calculatedAt: now,
      nextCalculationDue: nextWeek,
    },
    update: {
      medianRentPerYear: median,
      p25RentPerYear: p25,
      p75RentPerYear: p75,
      minRentPerYear: min,
      maxRentPerYear: max,
      listingCount: count,
      confidenceScore,
      isPublished,
      calculatedAt: now,
      nextCalculationDue: nextWeek,
    },
  });
}

/**
 * Enqueue all distinct (city, area, propertyType, bedrooms) combinations
 * that have at least one VERIFIED AVAILABLE listing.
 * Returns the list of combinations found.
 */
export async function getAllVerifiedCombinations(): Promise<
  Array<{ city: string; area: string; propertyType: PropertyType; bedrooms: number }>
> {
  const rows = await prisma.listing.groupBy({
    by: ['city', 'area', 'propertyType', 'bedrooms'],
    where: { tier: 'VERIFIED', status: 'AVAILABLE', deletedAt: null },
  });

  return rows.map((r) => ({
    city: r.city,
    area: r.area,
    propertyType: r.propertyType as PropertyType,
    bedrooms: r.bedrooms,
  }));
}
