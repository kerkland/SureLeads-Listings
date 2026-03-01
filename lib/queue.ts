import { Queue, Worker, QueueEvents } from 'bullmq';

// Use URL string to avoid ioredis version conflicts between app and bullmq
const connection = { url: process.env.REDIS_URL ?? 'redis://localhost:6379' };

export const QUEUES = {
  CROSS_POST_DETECTION: 'cross-post-detection',
  AUTO_REFUND: 'auto-refund',
  NOTIFICATIONS: 'notifications',
  REPUTATION: 'reputation',
  // SureLeads queues
  RECONFIRMATION_SCAN: 'reconfirmation-scan',
  RECONFIRMATION_CHECK: 'reconfirmation-check',
  PRICE_INDEX: 'price-index',
  CREDIBILITY: 'credibility',
} as const;

export function createQueue(name: string) {
  return new Queue(name, { connection });
}

// Generic helper — callers provide their own typed Worker directly
export { Worker };

export function createQueueEvents(name: string) {
  return new QueueEvents(name, { connection });
}

// Named queues
export const crossPostQueue = createQueue(QUEUES.CROSS_POST_DETECTION);
export const autoRefundQueue = createQueue(QUEUES.AUTO_REFUND);
export const notificationQueue = createQueue(QUEUES.NOTIFICATIONS);
export const reputationQueue = createQueue(QUEUES.REPUTATION);

// SureLeads queues
export const reconfirmationScanQueue = createQueue(QUEUES.RECONFIRMATION_SCAN);
export const reconfirmationCheckQueue = createQueue(QUEUES.RECONFIRMATION_CHECK);
export const priceIndexQueue = createQueue(QUEUES.PRICE_INDEX);
export const credibilityQueue = createQueue(QUEUES.CREDIBILITY);

export { connection };
