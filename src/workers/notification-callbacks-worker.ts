/**
 * Standalone entrypoint for the notification callbacks worker.
 *
 * Consume:
 *   npm run notifications:callback-worker
 *
 * Designed to run as a dedicated machine (Fly.io) or k8s pod so callback
 * HTTP timeouts don't block the API request loop.
 */

import { logger } from '@/lib/logger';
import { startNotificationCallbacksWorker } from './queues/notification-callbacks.queue';

async function main() {
  logger.info('[notification-callbacks] starting worker');
  const worker = startNotificationCallbacksWorker();

  const shutdown = async () => {
    logger.info('[notification-callbacks] shutting down...');
    await worker.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.error({ err }, '[notification-callbacks] fatal boot error');
  process.exit(1);
});
