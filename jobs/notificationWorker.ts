import { Worker, Job } from 'bullmq';
import { QUEUES } from '@/lib/queue';
import { notifyBoth } from '@/lib/notificationService';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

const notificationWorker = new Worker(
  QUEUES.NOTIFICATIONS,
  async (job: Job) => {
    const { data } = job;

    switch (job.name) {
      case 'dispute-opened':
        await notifyBoth({
          agentId: data.agentId,
          clientId: data.clientId,
          type: 'DISPUTE_OPENED',
          title: 'Inspection Dispute Raised',
          body: 'A dispute has been raised for your inspection. Our team will review within 48 hours.',
        });
        break;

      default:
        console.warn(`[notificationWorker] Unknown job: ${job.name}`);
    }
  },
  { connection, concurrency: 10 }
);

notificationWorker.on('failed', (job, err) => {
  console.error(`[notificationWorker] Job ${job?.id} (${job?.name}) failed:`, err);
});

export default notificationWorker;
