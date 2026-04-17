import { logger } from '@/lib/logger';
import { makeProcessDueRemindersUseCase } from '@/use-cases/calendar/events/factories/make-process-due-reminders-use-case';

const INTERVAL_MS = 60_000;

let intervalId: ReturnType<typeof setInterval> | null = null;
let consecutiveErrors = 0;
const MAX_CONSECUTIVE_ERRORS = 10;

async function processBatch() {
  const useCase = makeProcessDueRemindersUseCase();
  try {
    const result = await useCase.execute();
    consecutiveErrors = 0;
    if (result.processed > 0) {
      logger.info(
        {
          processed: result.processed,
          errors: result.errors,
        },
        'Calendar reminders batch processed',
      );
    }
  } catch (err) {
    consecutiveErrors++;
    logger.error(
      { err, consecutiveErrors, maxErrors: MAX_CONSECUTIVE_ERRORS },
      'Failed to process calendar reminders batch',
    );
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
      logger.error(
        `Calendar reminders scheduler stopping after ${MAX_CONSECUTIVE_ERRORS} consecutive failures`,
      );
      stopCalendarRemindersScheduler();
    }
  }
}

export function stopCalendarRemindersScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('Calendar reminders scheduler stopped');
  }
}

/**
 * P3-05: previously auto-started on module import. Now called explicitly from
 * the worker entrypoint so the BULLMQ_ENABLED gate can select between this
 * legacy in-process scheduler and the durable BullMQ-backed one.
 */
export async function startCalendarRemindersScheduler(): Promise<void> {
  if (intervalId) {
    logger.info('Calendar reminders scheduler already running');
    return;
  }

  try {
    await processBatch();
    intervalId = setInterval(processBatch, INTERVAL_MS);
    logger.info(
      { interval: INTERVAL_MS },
      'Calendar reminders scheduler worker started successfully',
    );
  } catch (err) {
    logger.error({ err }, 'Failed to start calendar reminders scheduler worker');
  }
}
