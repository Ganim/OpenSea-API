import { closeAllQueues } from '@/lib/queue';
import { stopCalendarRemindersScheduler } from './calendar-reminders-scheduler';
import {
  startEmailSyncScheduler,
  stopEmailSyncScheduler,
} from './email-sync-scheduler';
import { stopNotificationsScheduler } from './notifications-scheduler';
import { startEmailSyncWorker } from './queues/email-sync.queue';
import { startNotificationWorker } from './queues/notification.queue';

let workersStarted = false;
let isShuttingDown = false;

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

  // Stop all schedulers first (prevent new jobs from being enqueued)
  stopCalendarRemindersScheduler();
  stopEmailSyncScheduler();
  stopNotificationsScheduler();

  // Then close BullMQ queues and workers
  await closeAllQueues();
  workersStarted = false;
  console.log('[Workers] All workers stopped');
}

const SHUTDOWN_TIMEOUT_MS = 15_000;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[Workers] ${signal} received, shutting down...`);

  const shutdownTimer = setTimeout(() => {
    console.error(
      `[Workers] Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit`,
    );
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    await stopAllWorkers();
  } catch (err) {
    console.error('[Workers] Error during shutdown:', err);
  } finally {
    clearTimeout(shutdownTimer);
    process.exit(0);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start workers when this entrypoint runs (Dockerfile.worker: node build/workers/index.js)
startAllWorkers().catch((err) => {
  console.error('[Workers] Fatal error starting workers:', err);
  process.exit(1);
});
