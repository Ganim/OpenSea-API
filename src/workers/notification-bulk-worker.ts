/**
 * Standalone entrypoint for the notification bulk-dispatch worker.
 *
 * Consume:
 *   npm run notifications:bulk-worker
 */

import { logger } from '@/lib/logger';
import { startNotificationBulkDispatchWorker } from './queues/notification-bulk-dispatch.queue';

async function main() {
  logger.info('[notification-bulk] starting worker');
  const worker = startNotificationBulkDispatchWorker();

  const shutdown = async () => {
    logger.info('[notification-bulk] shutting down...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error({ err }, '[notification-bulk] fatal boot error');
  process.exit(1);
});
