import { closeAllQueues } from '@/lib/queue';
import { startEmailSyncScheduler } from './email-sync-scheduler';
import { startAuditWorker } from './queues/audit.queue';
import { startEmailSyncWorker } from './queues/email-sync.queue';
import { startNotificationWorker } from './queues/notification.queue';

let workersStarted = false;

/**
 * Inicia todos os workers de fila
 */
export async function startAllWorkers(): Promise<void> {
  if (workersStarted) {
    console.log('[Workers] Workers already started');
    return;
  }

  console.log('[Workers] Starting all queue workers...');

  startEmailSyncWorker();
  startNotificationWorker();
  startAuditWorker();

  // Start the email sync scheduler (enqueues periodic sync jobs)
  try {
    await startEmailSyncScheduler();
  } catch (err) {
    console.error('[Workers] Failed to start email sync scheduler:', err);
  }

  workersStarted = true;
  console.log('[Workers] All workers started successfully');
}

/**
 * Para todos os workers graciosamente
 */
export async function stopAllWorkers(): Promise<void> {
  console.log('[Workers] Stopping all queue workers...');
  await closeAllQueues();
  workersStarted = false;
  console.log('[Workers] All workers stopped');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Workers] SIGTERM received, shutting down...');
  await stopAllWorkers();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Workers] SIGINT received, shutting down...');
  await stopAllWorkers();
  process.exit(0);
});

// Start workers when this entrypoint runs (Dockerfile.worker: node build/workers/index.js)
startAllWorkers().catch((err) => {
  console.error('[Workers] Fatal error starting workers:', err);
  process.exit(1);
});
