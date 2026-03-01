import { Worker, Job } from 'bullmq';
import prisma from '@/lib/db';
import {
  addressSimilarity,
  computePhash,
  hammingDistance,
  fetchImageBuffer,
} from '@/lib/similarity';
import { QUEUES } from '@/lib/queue';
import { notifyUser } from '@/lib/notificationService';

const ADDRESS_THRESHOLD = 0.88;
const HAMMING_THRESHOLD = 8;
const CROSS_POST_DEADLINE_HOURS = 48;

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

const crossPostWorker = new Worker(
  QUEUES.CROSS_POST_DETECTION,
  async (job: Job<{ listingId: string }>) => {
    const { listingId } = job.data;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId, deletedAt: null },
    });
    if (!listing) return;

    // Get all other active listings (excluding same agent — same agent can have multiple)
    const candidates = await prisma.listing.findMany({
      where: {
        id: { not: listingId },
        status: { in: ['AVAILABLE', 'PAUSED'] },
        deletedAt: null,
        city: { equals: listing.city, mode: 'insensitive' },
      },
      select: {
        id: true,
        agentId: true,
        addressLine: true,
        photoHashes: true,
        photos: true,
        isCrossPostFlagged: true,
      },
    });

    for (const candidate of candidates) {
      // Skip if already flagged together
      const existingFlag = await prisma.crossPostingFlag.findFirst({
        where: {
          OR: [
            { listingAId: listingId, listingBId: candidate.id },
            { listingAId: candidate.id, listingBId: listingId },
          ],
          status: 'OPEN',
        },
      });
      if (existingFlag) continue;

      let addressMatch = false;
      let photoMatch = false;

      // ── Address similarity ──────────────────────────────────────────────
      const addrSim = addressSimilarity(listing.addressLine, candidate.addressLine);
      if (addrSim >= ADDRESS_THRESHOLD) {
        addressMatch = true;
      }

      // ── Photo hash comparison ────────────────────────────────────────────
      let listingHashes = listing.photoHashes;

      // Compute hashes on-the-fly if not stored
      if (!listingHashes.length && listing.photos.length) {
        try {
          const computed = await Promise.all(
            listing.photos.map(async (url) => {
              const buf = await fetchImageBuffer(url);
              return computePhash(buf);
            })
          );
          listingHashes = computed;
          await prisma.listing.update({
            where: { id: listing.id },
            data: { photoHashes: computed },
          });
        } catch (e) {
          console.warn('[crossPost] Photo hash compute failed:', e);
        }
      }

      if (listingHashes.length && candidate.photoHashes.length) {
        outer: for (const ha of listingHashes) {
          for (const hb of candidate.photoHashes) {
            if (ha.length === hb.length && hammingDistance(ha, hb) <= HAMMING_THRESHOLD) {
              photoMatch = true;
              break outer;
            }
          }
        }
      }

      if (!addressMatch && !photoMatch) continue;

      const detectionMethod = addressMatch && photoMatch ? 'BOTH' : addressMatch ? 'ADDRESS_MATCH' : 'PHOTO_HASH';
      const similarityScore = addressMatch ? addressSimilarity(listing.addressLine, candidate.addressLine) : 0.9;

      const deadlineAt = new Date(Date.now() + CROSS_POST_DEADLINE_HOURS * 60 * 60 * 1000);

      // Create flag + update both listings in a transaction
      await prisma.$transaction(async (tx) => {
        await tx.crossPostingFlag.create({
          data: {
            listingAId: listingId,
            listingBId: candidate.id,
            similarityScore,
            detectionMethod,
            deadlineAt,
            status: 'OPEN',
          },
        });

        await tx.listing.updateMany({
          where: { id: { in: [listingId, candidate.id] } },
          data: { isCrossPostFlagged: true },
        });
      });

      // Schedule a delayed job to auto-pause if unresolved at deadline
      const { crossPostQueue } = await import('@/lib/queue');
      await crossPostQueue.add(
        'auto-pause',
        { listingAId: listingId, listingBId: candidate.id },
        { delay: CROSS_POST_DEADLINE_HOURS * 60 * 60 * 1000 }
      );

      // Notify both agents
      const message = `Your listing may be duplicated. Please review within 48 hours or it will be paused.`;
      await Promise.all([
        notifyUser({
          userId: listing.agentId,
          type: 'CROSS_POST_FLAG',
          title: 'Cross-posting Alert',
          body: message,
          channel: 'IN_APP',
        }),
        notifyUser({
          userId: candidate.agentId,
          type: 'CROSS_POST_FLAG',
          title: 'Cross-posting Alert',
          body: message,
          channel: 'IN_APP',
        }),
      ]);

      console.log(`[crossPost] Flagged listings ${listingId} & ${candidate.id} via ${detectionMethod}`);
    }
  },
  { connection, concurrency: 3 }
);

// Handle delayed auto-pause jobs
crossPostWorker.on('completed', async (job) => {
  if (job.name !== 'auto-pause') return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { listingAId, listingBId } = job.data as any as { listingAId: string; listingBId: string };

  const flag = await prisma.crossPostingFlag.findFirst({
    where: {
      listingAId,
      listingBId,
      status: 'OPEN',
    },
  });
  if (!flag) return; // Already resolved

  // Pause both listings
  await prisma.$transaction(async (tx) => {
    await tx.crossPostingFlag.update({
      where: { id: flag.id },
      data: { status: 'BOTH_PAUSED' },
    });
    await tx.listing.updateMany({
      where: { id: { in: [listingAId, listingBId] } },
      data: { status: 'PAUSED' },
    });
  });

  // Apply reputation penalty
  const { applyEvent } = await import('@/lib/reputationService');
  const listingA = await prisma.listing.findUnique({ where: { id: listingAId }, select: { agentId: true } });
  const listingB = await prisma.listing.findUnique({ where: { id: listingBId }, select: { agentId: true } });
  if (listingA) await applyEvent(listingA.agentId, 'cross_post_violation', { listingId: listingAId });
  if (listingB) await applyEvent(listingB.agentId, 'cross_post_violation', { listingId: listingBId });
});

crossPostWorker.on('failed', (job, err) => {
  console.error(`[crossPost] Job ${job?.id} failed:`, err);
});

export default crossPostWorker;
