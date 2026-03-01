import 'dotenv/config';
import { credibilityQueue, Worker, connection, QUEUES } from '@/lib/queue';
import { recalculateCredibility } from '@/lib/credibilityService';

new Worker(
  QUEUES.CREDIBILITY,
  async (job) => {
    const { agentId } = job.data as { agentId: string };
    await recalculateCredibility(agentId);
    console.log(`[credibility-worker] Recalculated score for agent ${agentId}`);
  },
  { connection, concurrency: 10 }
);

console.log('[credibility-worker] Started');
