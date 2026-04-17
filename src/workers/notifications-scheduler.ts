import { logger } from '@/lib/logger';
import { makeProcessScheduledNotificationsUseCase } from '@/use-cases/notifications/factories/make-process-scheduled-notifications-use-case';

const interval = 60_000; // 1 minute

let intervalId: ReturnType<typeof setInterval> | null = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 10;

async function processBatch() {
  const useCase = makeProcessScheduledNotificationsUseCase();
  try {
    const result = await useCase.execute();
    consecutiveErrors = 0;
    if (result.processed > 0) {
      logger.info(
        {
          processed: result.processed,
          sent: result.sent.length,
          errors: result.errors,
        },
        'Scheduled notifications batch processed',
      );
    }
  } catch (err) {
    consecutiveErrors++;
    logger.error(
      { err, consecutiveErrors, maxErrors: MAX_CONSECUTIVE_ERRORS },
      'Failed to process scheduled notifications batch',
    );
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      logger.error(
        `Notifications scheduler stopping after ${MAX_CONSECUTIVE_ERRORS} consecutive failures`,
      );
      stopNotificationsScheduler();
    }
  }
}

export function stopNotificationsScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Notifications scheduler stopped');
  }
}

/**
 * P3-05: previously auto-started on module import. Now called explicitly from
 * the worker entrypoint so the BULLMQ_ENABLED gate can select between this
 * legacy in-process scheduler and the durable BullMQ-backed one.
 */
export async function startNotificationsScheduler(): Promise<void> {
  if (intervalId) {
    logger.info('Notifications scheduler already running');
    return;
  }

  try {
    await processBatch();
    intervalId = setInterval(processBatch, interval);
    logger.info(
      { interval },
      'Notifications scheduler worker started successfully',
    );
  } catch (err) {
    logger.error({ err }, 'Failed to start notifications scheduler worker');
  }
}
