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
import {
  sendReconfirmationWarningEmail,
  sendReconfirmationHiddenEmail,
} from '@/lib/resend';

// ─── Constants ────────────────────────────────────────────────────────────────
const RECONFIRMATION_CYCLE_DAYS = 7;
const WARNING_DAYS_BEFORE       = 2;  // Day 5: enter PENDING_RECONFIRMATION window
const FINAL_SMS_DAYS_BEFORE     = 1;  // Day 6: SMS-only nudge (no second email)
const GRACE_PERIOD_DAYS         = 30; // after auto-hide, agent has 30 days to reactivate

// ─── Register daily cron scan ─────────────────────────────────────────────────
reconfirmationScanQueue.add(
  'daily-scan',
  {},
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repeat:  { cron: '0 5 * * *' } as any, // 05:00 UTC = 06:00 WAT daily
    jobId: 'reconfirmation-daily-scan',
  },
);

// ─── Scanner Worker ───────────────────────────────────────────────────────────
// Cursor-paginates all eligible listings and enqueues per-listing checks.
// Now includes HIDDEN listings so grace-expired ones can be soft-deleted.
new Worker(
  QUEUES.RECONFIRMATION_SCAN,
  async () => {
    let cursor: string | undefined = undefined;
    let processed = 0;

    do {
      const listings: { id: string }[] = await prisma.listing.findMany({
        where: {
          tier:   'VERIFIED',
          status: { in: ['AVAILABLE', 'PENDING_RECONFIRMATION', 'HIDDEN'] },
          nextReconfirmationDue: { not: null },
          deletedAt: null,
        },
        select:  { id: true },
        take:    500,
        ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
        orderBy: { id: 'asc' },
      });

      for (const listing of listings) {
        await reconfirmationCheckQueue.add(
          'check',
          { listingId: listing.id },
          { jobId: `reconfirm-check-${listing.id}` },
        );
      }

      processed += listings.length;
      cursor = listings.length > 0 ? listings[listings.length - 1].id : undefined;
      if (listings.length < 500) break;
    } while (cursor);

    console.log(`[reconfirmation-scan] Enqueued ${processed} listing checks`);
  },
  { connection, concurrency: 1 },
);

// ─── Per-Listing Check Worker ─────────────────────────────────────────────────
// Four conditions checked in priority order:
//   1. Grace expired       → soft-delete (DELETED)
//   2. Auto-hide deadline  → hide + set graceExpiresAt + email
//   3. Day-6 SMS nudge     → SMS only (no second email this cycle)
//   4. Day-5 warning       → PENDING_RECONFIRMATION + IN_APP + SMS + EMAIL
new Worker(
  QUEUES.RECONFIRMATION_CHECK,
  async (job) => {
    const { listingId } = job.data as { listingId: string };
    const now = new Date();

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        id:                     true,
        agentId:                true,
        title:                  true,
        status:                 true,
        tier:                   true,
        nextReconfirmationDue:  true,
        pendingReconfirmationAt: true,
        graceExpiresAt:         true,
        hiddenAt:               true,
        deletedAt:              true,
      },
    });

    if (!listing || listing.tier !== 'VERIFIED' || listing.deletedAt) return;

    // ── Condition 1: Grace period expired ────────────────────────────────────
    // HIDDEN listing that the agent never reactivated within 30 days → soft-delete
    if (listing.status === 'HIDDEN' && listing.graceExpiresAt && listing.graceExpiresAt <= now) {
      await prisma.listing.update({
        where: { id: listingId },
        data:  { deletedAt: now },
      });

      await notificationQueue.add('send', {
        userId:  listing.agentId,
        type:    'LISTING_EXPIRED',
        title:   'Listing permanently removed',
        body:    `Your listing "${listing.title}" has been permanently removed after 30 days without reconfirmation.`,
        channel: 'IN_APP',
      });

      console.log(`[reconfirmation-check] Grace expired → deleted listing ${listingId}`);
      return;
    }

    const due = listing.nextReconfirmationDue;
    if (!due) return;

    // ── Condition 2: Auto-hide deadline passed ────────────────────────────────
    // PENDING_RECONFIRMATION listing whose deadline has passed → hide it
    if (listing.status === 'PENDING_RECONFIRMATION' && due <= now) {
      const graceExpiresAt = new Date(now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        prisma.reconfirmationRecord.create({
          data: {
            listingId,
            agentId:   listing.agentId,
            dueAt:     due,
            wasOnTime: false,
            method:    'AUTO_MISSED',
          },
        }),
        prisma.listing.update({
          where: { id: listingId },
          data:  {
            status:                   'HIDDEN',
            hiddenAt:                 now,
            graceExpiresAt,
            reconfirmationMissedCount: { increment: 1 },
          },
        }),
      ]);

      // IN_APP notification (always)
      await notificationQueue.add('send', {
        userId:  listing.agentId,
        type:    'RECONFIRMATION_MISSED',
        title:   'Listing hidden',
        body:    `Your listing "${listing.title}" has been hidden due to a missed reconfirmation. Reactivate within 30 days.`,
        channel: 'IN_APP',
      });

      // EMAIL notification (if agent has email + not already notified today)
      const agent = await prisma.user.findUnique({
        where:  { id: listing.agentId },
        select: { email: true, fullName: true },
      });

      if (agent?.email) {
        // Deduplicate: skip if we already sent a RECONFIRMATION_MISSED email today
        const today00 = new Date(now);
        today00.setHours(0, 0, 0, 0);
        const alreadySent = await prisma.notification.findFirst({
          where: {
            userId:    listing.agentId,
            type:      'RECONFIRMATION_MISSED_EMAIL',
            channel:   'EMAIL',
            createdAt: { gte: today00 },
          },
        });

        if (!alreadySent) {
          // Record before sending (fire-and-forget pattern)
          await prisma.notification.create({
            data: {
              userId:  listing.agentId,
              type:    'RECONFIRMATION_MISSED_EMAIL',
              title:   'Listing hidden email sent',
              body:    `Hidden email dispatched for "${listing.title}"`,
              channel: 'EMAIL',
            },
          });

          // Collect all other listings hidden today for digest
          const allHiddenToday = await prisma.listing.findMany({
            where: {
              agentId:  listing.agentId,
              status:   'HIDDEN',
              hiddenAt: { gte: today00 },
              deletedAt: null,
            },
            select: { title: true, hiddenAt: true, graceExpiresAt: true },
          });

          const digestListings = allHiddenToday
            .filter((l) => l.hiddenAt && l.graceExpiresAt)
            .map((l) => ({
              title:          l.title,
              hiddenAt:       l.hiddenAt!,
              graceExpiresAt: l.graceExpiresAt!,
            }));

          sendReconfirmationHiddenEmail({
            agentEmail:   agent.email,
            agentName:    agent.fullName,
            listings:     digestListings.length > 0 ? digestListings : [{ title: listing.title, hiddenAt: now, graceExpiresAt }],
            reconfirmUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sureleads.ng'}/dashboard/reconfirmations`,
          }).catch((err) => console.error('[reconfirmation-check] Failed to send hidden email', err));
        }
      }

      await credibilityQueue.add(
        'recalculate',
        { agentId: listing.agentId },
        { jobId: `credibility-${listing.agentId}` },
      );

      return;
    }

    // ── Condition 3: Day-6 final SMS nudge ────────────────────────────────────
    // PENDING_RECONFIRMATION within 1 day of deadline, and warning was sent >12h ago → SMS only
    const finalSmsThreshold = new Date(now.getTime() + FINAL_SMS_DAYS_BEFORE * 24 * 60 * 60 * 1000);
    const warningAge = listing.pendingReconfirmationAt
      ? now.getTime() - listing.pendingReconfirmationAt.getTime()
      : 0;
    const warningOldEnough = warningAge > 12 * 60 * 60 * 1000; // > 12 hours

    if (
      listing.status === 'PENDING_RECONFIRMATION' &&
      due <= finalSmsThreshold &&
      due > now &&
      warningOldEnough
    ) {
      await notificationQueue.add('send', {
        userId:  listing.agentId,
        type:    'RECONFIRMATION_FINAL_WARNING',
        title:   'Final reminder',
        body:    `⚠ Last chance: "${listing.title}" expires today. Reconfirm now to keep it visible.`,
        channel: 'SMS',
      });

      return;
    }

    // ── Condition 4: Day-5 warning window ────────────────────────────────────
    // AVAILABLE listing approaching deadline → enter PENDING_RECONFIRMATION
    const warningThreshold = new Date(now.getTime() + WARNING_DAYS_BEFORE * 24 * 60 * 60 * 1000);

    if (listing.status === 'AVAILABLE' && due <= warningThreshold) {
      await prisma.listing.update({
        where: { id: listingId },
        data:  { status: 'PENDING_RECONFIRMATION', pendingReconfirmationAt: now },
      });

      // IN_APP notification
      await notificationQueue.add('send', {
        userId:  listing.agentId,
        type:    'RECONFIRMATION_WARNING',
        title:   'Reconfirmation needed',
        body:    `Your listing "${listing.title}" needs reconfirmation by ${due.toLocaleDateString('en-NG')} or it will be hidden.`,
        channel: 'IN_APP',
      });

      // SMS notification
      await notificationQueue.add('send', {
        userId:  listing.agentId,
        type:    'RECONFIRMATION_WARNING',
        title:   'Reconfirmation needed',
        body:    `SureLeads: "${listing.title}" needs reconfirmation by ${due.toLocaleDateString('en-NG')} or it will be hidden. Visit the app to confirm.`,
        channel: 'SMS',
      });

      // EMAIL notification (digest — only once per day per agent)
      const agent = await prisma.user.findUnique({
        where:  { id: listing.agentId },
        select: { email: true, fullName: true },
      });

      if (agent?.email) {
        const today00 = new Date(now);
        today00.setHours(0, 0, 0, 0);
        const alreadySentWarning = await prisma.notification.findFirst({
          where: {
            userId:    listing.agentId,
            type:      'RECONFIRMATION_WARNING_EMAIL',
            channel:   'EMAIL',
            createdAt: { gte: today00 },
          },
        });

        if (!alreadySentWarning) {
          // Record before sending
          await prisma.notification.create({
            data: {
              userId:  listing.agentId,
              type:    'RECONFIRMATION_WARNING_EMAIL',
              title:   'Reconfirmation warning email sent',
              body:    `Warning email dispatched for "${listing.title}"`,
              channel: 'EMAIL',
            },
          });

          // Collect all listings newly entering PENDING_RECONFIRMATION today for digest
          const allWarningToday = await prisma.listing.findMany({
            where: {
              agentId:                listing.agentId,
              status:                 'PENDING_RECONFIRMATION',
              pendingReconfirmationAt: { gte: today00 },
              deletedAt:              null,
            },
            select: { title: true, nextReconfirmationDue: true },
          });

          const digestListings = allWarningToday
            .filter((l) => l.nextReconfirmationDue)
            .map((l) => ({ title: l.title, dueAt: l.nextReconfirmationDue! }));

          sendReconfirmationWarningEmail({
            agentEmail:   agent.email,
            agentName:    agent.fullName,
            listings:     digestListings.length > 0 ? digestListings : [{ title: listing.title, dueAt: due }],
            reconfirmUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://sureleads.ng'}/dashboard/reconfirmations`,
          }).catch((err) => console.error('[reconfirmation-check] Failed to send warning email', err));
        }
      }
    }
  },
  { connection, concurrency: 20 },
);

console.log('[reconfirmation-worker] Started (scan + check workers, grace period: 30 days)');
