/**
 * priceIndexService.ts — SureLeads Area Price Intelligence
 *
 * Rules:
 *  - Only VERIFIED + AVAILABLE listings
 *  - Only listings reconfirmed within the last 30 days (rolling window)
 *  - Hard price bounds: ₦50,000 – ₦500,000,000 / yr (in kobo)
 *  - IQR outlier removal (Tukey fences: Q1 – 1.5×IQR, Q3 + 1.5×IQR)
 *  - Minimum 3 clean listings AND 2 distinct agents to publish
 *  - Dominated market: one agent supplies > 50% of the sample
 *  - Trend: compare current 30-day median vs previous 30-day median
 *    > +3% = UP, < -3% = DOWN, else STABLE
 *  - Confidence: min(1.0, count / 15), reduced 30% for dominated markets
 */

import prisma from './db';
import type { PropertyType, PriceTrend, PriceDataQualityFlag } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

const WINDOW_DAYS         = 30;
const MIN_PUBLISH_COUNT   = 3;
const MIN_AGENT_COUNT     = 2;
const MAX_CONFIDENCE_AT   = 15;                           // full confidence at 15 listings
const HARD_MIN_KOBO       = BigInt(50_000 * 100);        // ₦50k / yr
const HARD_MAX_KOBO       = BigInt(500_000_000 * 100);   // ₦500M / yr
const TREND_UP_PCT        = 3;
const TREND_DOWN_PCT      = -3;
const DOMINATED_THRESHOLD = 0.5;                         // one agent > 50%

// ─── Statistics helpers ───────────────────────────────────────────────────────

function percentile(sorted: bigint[], p: number): bigint {
  if (sorted.length === 0) return BigInt(0);
  const idx   = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return sorted[lower];
  const frac = idx - lower;
  return BigInt(
    Math.round(
      Number(sorted[lower]) + frac * (Number(sorted[upper]) - Number(sorted[lower])),
    ),
  );
}

function removeOutliers(values: bigint[]): bigint[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const q1     = Number(percentile(sorted, 25));
  const q3     = Number(percentile(sorted, 75));
  const iqr    = q3 - q1;
  const lower  = q1 - 1.5 * iqr;
  const upper  = q3 + 1.5 * iqr;
  return sorted.filter((v) => Number(v) >= lower && Number(v) <= upper);
}

// ─── Window bounds ────────────────────────────────────────────────────────────

function windowBounds(daysAgo: number): { from: Date; to: Date } {
  const to   = new Date();
  const from = new Date(to.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  return { from, to };
}

// ─── Fetch listings in a time window ─────────────────────────────────────────

async function fetchWindowListings(params: {
  city:         string;
  area:         string;
  propertyType: PropertyType;
  bedrooms:     number;
  from:         Date;
  to:           Date;
}): Promise<Array<{ rentPerYear: bigint; agentId: string }>> {
  const { city, area, propertyType, bedrooms, from, to } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: Record<string, any> = {
    city,
    area,
    propertyType,
    tier:              'VERIFIED',
    status:            'AVAILABLE',
    deletedAt:         null,
    lastReconfirmedAt: { gte: from, lte: to },
  };
  if (bedrooms !== -1) whereClause.bedrooms = bedrooms;

  return prisma.listing.findMany({
    where:  whereClause,
    select: { rentPerYear: true, agentId: true },
  });
}

// ─── Per-window statistics ────────────────────────────────────────────────────

interface WindowStats {
  median:           bigint;
  p25:              bigint;
  p75:              bigint;
  min:              bigint;
  max:              bigint;
  count:            number;
  agentCount:       number;
  isDominated:      boolean;
  dataQualityFlags: PriceDataQualityFlag[];
  confidenceScore:  number;
  isPublished:      boolean;
}

function computeWindowStats(
  rawRows: Array<{ rentPerYear: bigint; agentId: string }>,
): WindowStats | null {
  // 1. Hard bounds
  const bounded = rawRows.filter(
    (r) => r.rentPerYear >= HARD_MIN_KOBO && r.rentPerYear <= HARD_MAX_KOBO,
  );

  // 2. IQR outlier removal (on rent values only)
  const rentValues = bounded.map((r) => r.rentPerYear);
  const cleaned    = removeOutliers(rentValues);

  // 3. Reconstruct agent counts for the cleaned set.
  //    outlier removal sorts values; use a FIFO queue keyed by value string.
  const agentQueue = new Map<string, string[]>();
  for (const row of bounded) {
    const key = row.rentPerYear.toString();
    if (!agentQueue.has(key)) agentQueue.set(key, []);
    agentQueue.get(key)!.push(row.agentId);
  }

  const agentCounts = new Map<string, number>();
  for (const val of cleaned) {
    const key     = val.toString();
    const queue   = agentQueue.get(key) ?? [];
    const agentId = queue.shift() ?? 'unknown';
    agentQueue.set(key, queue);
    agentCounts.set(agentId, (agentCounts.get(agentId) ?? 0) + 1);
  }

  const count      = cleaned.length;
  const agentCount = agentCounts.size;

  if (count === 0) return null;

  // 4. Dominated market
  const maxByOneAgent = Math.max(...Array.from(agentCounts.values()));
  const isDominated   = maxByOneAgent / count > DOMINATED_THRESHOLD;

  // 5. Data quality flags
  const flags: PriceDataQualityFlag[] = [];
  if (count < 5)                        flags.push('LOW_VOLUME');
  if (agentCount === 1)                 flags.push('SINGLE_AGENT');
  if (isDominated && agentCount > 1)    flags.push('DOMINATED_MARKET');

  // 6. Publish gate
  const isPublished = count >= MIN_PUBLISH_COUNT && agentCount >= MIN_AGENT_COUNT;

  // 7. Confidence
  let confidenceScore = Math.min(1.0, count / MAX_CONFIDENCE_AT);
  if (isDominated) confidenceScore = Math.round(confidenceScore * 0.7 * 100) / 100;

  // 8. Statistics
  const sorted = [...cleaned].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const median = percentile(sorted, 50);
  const p25    = percentile(sorted, 25);
  const p75    = percentile(sorted, 75);
  const min    = sorted[0];
  const max    = sorted[sorted.length - 1];

  return {
    median, p25, p75, min, max,
    count, agentCount,
    isDominated,
    dataQualityFlags: flags,
    confidenceScore,
    isPublished,
  };
}

// ─── Trend calculation ────────────────────────────────────────────────────────

function calcTrend(
  currentMedian: bigint,
  previousMedian: bigint | null,
): { direction: PriceTrend; changePercent: number | null } {
  if (!previousMedian || previousMedian === BigInt(0)) {
    return { direction: 'STABLE', changePercent: null };
  }
  const pct     = ((Number(currentMedian) - Number(previousMedian)) / Number(previousMedian)) * 100;
  const rounded = Math.round(pct * 10) / 10;
  const direction: PriceTrend =
    rounded >= TREND_UP_PCT   ? 'UP'   :
    rounded <= TREND_DOWN_PCT ? 'DOWN' :
    'STABLE';
  return { direction, changePercent: rounded };
}

// ─── Public: recalculate one combination ─────────────────────────────────────

export async function recalculatePriceIndex(params: {
  city:         string;
  area:         string;
  propertyType: PropertyType;
  bedrooms:     number;  // -1 for aggregate
}): Promise<void> {
  const { city, area, propertyType, bedrooms } = params;

  const now      = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // ── Current window (last 30 days) ──
  const { from: currFrom, to: currTo } = windowBounds(WINDOW_DAYS);
  const currRows  = await fetchWindowListings({ city, area, propertyType, bedrooms, from: currFrom, to: currTo });
  const currStats = computeWindowStats(currRows);

  // ── Previous window (days 31–60 ago) ──
  const prevTo   = currFrom;
  const prevFrom = new Date(prevTo.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const prevRows  = await fetchWindowListings({ city, area, propertyType, bedrooms, from: prevFrom, to: prevTo });
  const prevStats = computeWindowStats(prevRows);

  const prevMedian = prevStats?.median ?? null;

  if (!currStats) {
    // Write unpublished tombstone so we know the combination exists
    await prisma.areaPriceIndex.upsert({
      where:  { city_area_propertyType_bedrooms: { city, area, propertyType, bedrooms } },
      create: {
        city, area, propertyType, bedrooms,
        medianRentPerYear:         BigInt(0),
        p25RentPerYear:            BigInt(0),
        p75RentPerYear:            BigInt(0),
        minRentPerYear:            BigInt(0),
        maxRentPerYear:            BigInt(0),
        listingCount:              0,
        agentCount:                0,
        confidenceScore:           0,
        isPublished:               false,
        isDominatedMarket:         false,
        dataQualityFlags:          [],
        trendDirection:            null,
        priceChangePercent:        null,
        previousMedianRentPerYear: null,
        calculatedAt:              now,
        nextCalculationDue:        nextWeek,
      },
      update: {
        medianRentPerYear:         BigInt(0),
        p25RentPerYear:            BigInt(0),
        p75RentPerYear:            BigInt(0),
        minRentPerYear:            BigInt(0),
        maxRentPerYear:            BigInt(0),
        listingCount:              0,
        agentCount:                0,
        confidenceScore:           0,
        isPublished:               false,
        isDominatedMarket:         false,
        dataQualityFlags:          [],
        trendDirection:            null,
        priceChangePercent:        null,
        previousMedianRentPerYear: null,
        calculatedAt:              now,
        nextCalculationDue:        nextWeek,
      },
    });
    return;
  }

  const { direction, changePercent } = calcTrend(currStats.median, prevMedian);

  const record = {
    medianRentPerYear:         currStats.median,
    p25RentPerYear:            currStats.p25,
    p75RentPerYear:            currStats.p75,
    minRentPerYear:            currStats.min,
    maxRentPerYear:            currStats.max,
    listingCount:              currStats.count,
    agentCount:                currStats.agentCount,
    confidenceScore:           currStats.confidenceScore,
    isPublished:               currStats.isPublished,
    isDominatedMarket:         currStats.isDominated,
    dataQualityFlags:          currStats.dataQualityFlags,
    trendDirection:            direction,
    priceChangePercent:        changePercent,
    previousMedianRentPerYear: prevMedian,
    calculatedAt:              now,
    nextCalculationDue:        nextWeek,
  };

  await prisma.areaPriceIndex.upsert({
    where:  { city_area_propertyType_bedrooms: { city, area, propertyType, bedrooms } },
    create: { city, area, propertyType, bedrooms, ...record },
    update: record,
  });
}

/**
 * Returns all distinct (city, area, propertyType, bedrooms) combinations
 * that had at least one VERIFIED AVAILABLE listing reconfirmed in the last 30 days.
 */
export async function getAllVerifiedCombinations(): Promise<
  Array<{ city: string; area: string; propertyType: PropertyType; bedrooms: number }>
> {
  const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const rows = await prisma.listing.groupBy({
    by:    ['city', 'area', 'propertyType', 'bedrooms'],
    where: {
      tier:              'VERIFIED',
      status:            'AVAILABLE',
      deletedAt:         null,
      lastReconfirmedAt: { gte: cutoff },
    },
  });

  return rows.map((r) => ({
    city:         r.city,
    area:         r.area,
    propertyType: r.propertyType as PropertyType,
    bedrooms:     r.bedrooms,
  }));
}
