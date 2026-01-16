import { startEmailWorker } from './queues/email.queue';
import { startNotificationWorker } from './queues/notification.queue';
import { startAuditWorker } from './queues/audit.queue';
import { closeAllQueues } from '@/lib/queue';

let workersStarted = false;

/**
 * Inicia todos os workers de fila
 */
export function startAllWorkers(): void {
  if (workersStarted) {
    console.log('[Workers] Workers already started');
    return;
  }

  console.log('[Workers] Starting all queue workers...');

  startEmailWorker();
  startNotificationWorker();
  startAuditWorker();

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
