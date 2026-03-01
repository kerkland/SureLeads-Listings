import 'dotenv/config';
import prisma from '@/lib/db';
import {
  reconfirmationScanQueue,
  reconfirmationCheckQueue,
  notificationQueue,
  credibilityQueue,
  Worker,
  connection,
  QUEUES,
} from '@/lib/queue';

const RECONFIRMATION_CYCLE_DAYS = 7;
const WARNING_DAYS_BEFORE = 2; // warn when 2 days remain

// ─── Register daily cron scan ─────────────────────────────────────────────────
reconfirmationScanQueue.add(
  'daily-scan',
  {},
  {
    repeat: { cron: '0 5 * * *' }, // 05:00 UTC = 06:00 WAT daily
    jobId: 'reconfirmation-daily-scan',
  }
);

// ─── Scanner Worker ───────────────────────────────────────────────────────────
new Worker(
  QUEUES.RECONFIRMATION_SCAN,
  async () => {
    const now = new Date();
    const warningThreshold = new Date(
      now.getTime() + WARNING_DAYS_BEFORE * 24 * 60 * 60 * 1000
    );

    // Batch cursor-based scan
    let cursor: string | undefined = undefined;
    let processed = 0;

    do {
      const listings = await prisma.listing.findMany({
        where: {
          tier: 'VERIFIED',
          status: { in: ['AVAILABLE', 'PENDING_RECONFIRMATION'] },
          nextReconfirmationDue: { not: null },
          deletedAt: null,
        },
        select: { id: true },
        take: 500,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { id: 'asc' },
      });

      for (const listing of listings) {
        await reconfirmationCheckQueue.add(
          'check',
          { listingId: listing.id },
          { jobId: `reconfirm-check-${listing.id}` }
        );
      }

      processed += listings.length;
      cursor = listings.length > 0 ? listings[listings.length - 1].id : undefined;

      if (listings.length < 500) break;
    } while (cursor);

    console.log(`[reconfirmation-scan] Enqueued ${processed} listing checks`);
  },
  { connection, concurrency: 1 }
);

// ─── Per-Listing Check Worker ─────────────────────────────────────────────────
new Worker(
  QUEUES.RECONFIRMATION_CHECK,
  async (job) => {
    const { listingId } = job.data as { listingId: string };
    const now = new Date();
    const warningThreshold = new Date(
      now.getTime() + WARNING_DAYS_BEFORE * 24 * 60 * 60 * 1000
    );

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id: true,
        agentId: true,
        title: true,
        status: true,
        tier: true,
        nextReconfirmationDue: true,
        deletedAt: true,
      },
    });

    if (!listing || listing.tier !== 'VERIFIED' || listing.deletedAt) return;

    const due = listing.nextReconfirmationDue;
    if (!due) return;

    // Day 7: deadline passed — auto-hide
    if (listing.status === 'PENDING_RECONFIRMATION' && due <= now) {
      await prisma.$transaction([
        prisma.reconfirmationRecord.create({
          data: {
            listingId,
            agentId: listing.agentId,
            dueAt: due,
            wasOnTime: false,
            method: 'AUTO_MISSED',
          },
        }),
        prisma.listing.update({
          where: { id: listingId },
          data: {
            status: 'HIDDEN',
            hiddenAt: now,
            reconfirmationMissedCount: { increment: 1 },
          },
        }),
      ]);

      await notificationQueue.add('send', {
        userId: listing.agentId,
        type: 'RECONFIRMATION_MISSED',
        title: 'Listing hidden',
        body: `Your listing "${listing.title}" has been hidden due to a missed weekly reconfirmation.`,
        channel: 'IN_APP',
      });

      await credibilityQueue.add(
        'recalculate',
        { agentId: listing.agentId },
        { jobId: `credibility-${listing.agentId}` }
      );

      return;
    }

    // Day 5: approaching deadline — warn
    if (listing.status === 'AVAILABLE' && due <= warningThreshold) {
      await prisma.listing.update({
        where: { id: listingId },
        data: { status: 'PENDING_RECONFIRMATION', pendingReconfirmationAt: now },
      });

      await notificationQueue.add('send', {
        userId: listing.agentId,
        type: 'RECONFIRMATION_WARNING',
        title: 'Reconfirmation needed',
        body: `Your listing "${listing.title}" needs reconfirmation by ${due.toLocaleDateString('en-NG')} or it will be hidden.`,
        channel: 'IN_APP',
      });

      await notificationQueue.add('send', {
        userId: listing.agentId,
        type: 'RECONFIRMATION_WARNING',
        title: 'Reconfirmation needed',
        body: `Your listing "${listing.title}" needs reconfirmation by ${due.toLocaleDateString('en-NG')} or it will be hidden.`,
        channel: 'SMS',
      });
    }
  },
  { connection, concurrency: 20 }
);

console.log('[reconfirmation-worker] Started (scan + check workers)');
