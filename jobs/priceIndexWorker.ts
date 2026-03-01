import 'dotenv/config';
import {
  priceIndexQueue,
  Worker,
  connection,
  QUEUES,
} from '@/lib/queue';
import { recalculatePriceIndex, getAllVerifiedCombinations } from '@/lib/priceIndexService';
import type { PropertyType } from '@/types';

// ─── Register weekly cron scan ────────────────────────────────────────────────
priceIndexQueue.add(
  'weekly-scan',
  {},
  {
    repeat: { cron: '0 3 * * 1' }, // 03:00 UTC Monday = 04:00 WAT
    jobId: 'price-index-weekly-scan',
  }
);

// ─── Price Index Worker ───────────────────────────────────────────────────────
new Worker(
  QUEUES.PRICE_INDEX,
  async (job) => {
    const data = job.data as {
      action?: 'scan';
      city?: string;
      area?: string;
      propertyType?: PropertyType;
      bedrooms?: number;
    };

    // Weekly scan: enqueue all combinations
    if (data.action === 'scan' || !data.city) {
      const combinations = await getAllVerifiedCombinations();
      for (const combo of combinations) {
        await priceIndexQueue.add('recalculate', combo, {
          jobId: `price-index-${combo.city}-${combo.area}-${combo.propertyType}-${combo.bedrooms}`,
        });
        // Also enqueue aggregate (bedrooms = -1) for each distinct city+area+propertyType
      }
      const aggregates = new Map<string, { city: string; area: string; propertyType: PropertyType }>();
      for (const combo of combinations) {
        const key = `${combo.city}|${combo.area}|${combo.propertyType}`;
        if (!aggregates.has(key)) {
          aggregates.set(key, { city: combo.city, area: combo.area, propertyType: combo.propertyType });
        }
      }
      for (const [key, combo] of aggregates) {
        await priceIndexQueue.add('recalculate', { ...combo, bedrooms: -1 }, {
          jobId: `price-index-${key}--1`,
        });
      }
      console.log(`[price-index-worker] Enqueued ${combinations.length} recalculations`);
      return;
    }

    // Per-combination recalculation
    const { city, area, propertyType, bedrooms = -1 } = data;
    await recalculatePriceIndex({ city, area, propertyType, bedrooms });
    console.log(`[price-index-worker] Recalculated ${city}/${area}/${propertyType}/${bedrooms}`);
  },
  { connection, concurrency: 5 }
);

console.log('[price-index-worker] Started');
