/**
 * Main worker entry point.
 * Run with: ts-node jobs/worker.ts
 * Or in production: node dist/jobs/worker.js
 */
import 'dotenv/config';

// Import workers (each registers itself)
import './crossPostDetection';
import './notificationWorker';
import './reputationWorker';

// SureLeads workers
import './reconfirmationWorker';
import './priceIndexWorker';
import './credibilityWorker';

console.log('[worker] All workers started');
