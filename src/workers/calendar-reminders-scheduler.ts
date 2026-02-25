import { logger } from '@/lib/logger';
import { makeProcessDueRemindersUseCase } from '@/use-cases/calendar/events/factories/make-process-due-reminders-use-case';

const INTERVAL_MS = 60_000;

async function processBatch() {
  const useCase = makeProcessDueRemindersUseCase();
  try {
    const result = await useCase.execute();
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
    logger.error({ err }, 'Failed to process calendar reminders batch');
    throw err;
  }
}

// Initial run + start interval
try {
  await processBatch();
  setInterval(processBatch, INTERVAL_MS);
  logger.info({ interval: INTERVAL_MS }, 'Calendar reminders scheduler worker started successfully');
} catch {
  logger.error('Failed to start calendar reminders scheduler worker');
}
