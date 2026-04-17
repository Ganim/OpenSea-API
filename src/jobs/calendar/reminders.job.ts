import { logger } from '@/lib/logger';
import { makeProcessDueRemindersUseCase } from '@/use-cases/calendar/events/factories/make-process-due-reminders-use-case';

export interface CalendarRemindersJobData {
  trigger?: 'cron' | 'manual';
}

export interface CalendarRemindersRunResult {
  processed: number;
  errors: number;
}

export type RemindersUseCaseFactory = () => {
  execute: () => Promise<{ processed: number; errors: number }>;
};

const LOG_PREFIX = '[CalendarRemindersJob]';

const defaultUseCaseFactory: RemindersUseCaseFactory = () =>
  makeProcessDueRemindersUseCase();

export async function runCalendarRemindersJob(
  data: CalendarRemindersJobData = {},
  deps: { factory?: RemindersUseCaseFactory } = {},
): Promise<CalendarRemindersRunResult> {
  const startedAt = Date.now();
  const trigger = data.trigger ?? 'cron';
  const factory = deps.factory ?? defaultUseCaseFactory;

  try {
    const useCase = factory();
    const result = await useCase.execute();

    if (result.processed > 0) {
      logger.info(
        {
          trigger,
          processed: result.processed,
          errors: result.errors,
          durationMs: Date.now() - startedAt,
        },
        `${LOG_PREFIX} Batch processed`,
      );
    }

    return { processed: result.processed, errors: result.errors };
  } catch (error) {
    logger.error(
      { trigger, error, durationMs: Date.now() - startedAt },
      `${LOG_PREFIX} Batch failed`,
    );
    throw error;
  }
}
