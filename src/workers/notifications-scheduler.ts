import { env } from '@/@env';
import { logger } from '@/lib/logger';
import { makeProcessScheduledNotificationsUseCase } from '@/use-cases/notifications/factories/make-process-scheduled-notifications-use-case';

async function processBatch() {
  const useCase = makeProcessScheduledNotificationsUseCase();
  try {
    const result = await useCase.execute();
    if (result.processed > 0) {
      logger.info({
        processed: result.processed,
        sent: result.sent.length,
        errors: result.errors,
      }, 'Scheduled notifications batch processed');
    }
  } catch (err) {
    logger.error({ err }, 'Failed to process scheduled notifications batch');
  }
}

// Initial run
processBatch();

// Interval loop
const interval = env.NOTIFICATIONS_CRON_INTERVAL_MS;
logger.info({ interval }, 'Starting notifications scheduler worker');
setInterval(processBatch, interval);
