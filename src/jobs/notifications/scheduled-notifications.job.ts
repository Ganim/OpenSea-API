import { logger } from '@/lib/logger';
import { makeProcessScheduledNotificationsUseCase } from '@/use-cases/notifications/factories/make-process-scheduled-notifications-use-case';

export interface ScheduledNotificationsJobData {
  trigger?: 'cron' | 'manual';
}

export interface ScheduledNotificationsRunResult {
  processed: number;
  sent: number;
  errors: number;
}

export type ScheduledNotificationsUseCaseFactory = () => {
  execute: () => Promise<{
    processed: number;
    sent: unknown[];
    errors: number;
  }>;
};

const LOG_PREFIX = '[ScheduledNotificationsJob]';

const defaultUseCaseFactory: ScheduledNotificationsUseCaseFactory = () =>
  makeProcessScheduledNotificationsUseCase();

export async function runScheduledNotificationsJob(
  data: ScheduledNotificationsJobData = {},
  deps: { factory?: ScheduledNotificationsUseCaseFactory } = {},
): Promise<ScheduledNotificationsRunResult> {
  const startedAt = Date.now();
  const trigger = data.trigger ?? 'cron';
  const factory = deps.factory ?? defaultUseCaseFactory;

  try {
    const useCase = factory();
    const result = await useCase.execute();
    const sentCount = result.sent.length;

    if (result.processed > 0) {
      logger.info(
        {
          trigger,
          processed: result.processed,
          sent: sentCount,
          errors: result.errors,
          durationMs: Date.now() - startedAt,
        },
        `${LOG_PREFIX} Batch processed`,
      );
    }

    return {
      processed: result.processed,
      sent: sentCount,
      errors: result.errors,
    };
  } catch (error) {
    logger.error(
      { trigger, error, durationMs: Date.now() - startedAt },
      `${LOG_PREFIX} Batch failed`,
    );
    throw error;
  }
}
