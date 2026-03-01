import { Worker, Job } from 'bullmq';
import { QUEUES } from '@/lib/queue';
import { applyEvent } from '@/lib/reputationService';
import type { ReputationEvent } from '@/types';

const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

const reputationWorker = new Worker(
  QUEUES.REPUTATION,
  async (job: Job<{ agentId: string; event: ReputationEvent; metadata?: Record<string, unknown> }>) => {
    const { agentId, event, metadata } = job.data;
    await applyEvent(agentId, event, metadata);
    console.log(`[reputation] Applied ${event} to agent ${agentId}`);
  },
  { connection, concurrency: 5 }
);

reputationWorker.on('failed', (job, err) => {
  console.error(`[reputationWorker] Job ${job?.id} failed:`, err);
});

export default reputationWorker;
