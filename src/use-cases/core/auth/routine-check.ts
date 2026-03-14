import { logger } from '@/lib/logger';
import type { ProcessDueRemindersUseCase } from '@/use-cases/calendar/events/process-due-reminders';
import type { CheckOverdueEntriesUseCase } from '@/use-cases/finance/entries/check-overdue-entries';

interface RoutineCheckRequest {
  tenantId: string;
  userId: string;
}

interface RoutineCheckResponse {
  finance: { markedOverdue: number; dueSoonAlerts: number } | null;
  calendarReminders: { processed: number; errors: number } | null;
}

export class RoutineCheckUseCase {
  constructor(
    private checkOverdueEntries: CheckOverdueEntriesUseCase,
    private processDueReminders: ProcessDueRemindersUseCase,
  ) {}

  async execute(request: RoutineCheckRequest): Promise<RoutineCheckResponse> {
    const { tenantId, userId } = request;
    const t0 = Date.now();
    const mem0 = process.memoryUsage();

    logger.info(
      { tenantId, userId, heapMB: Math.round(mem0.heapUsed / 1024 / 1024) },
      '[routine-check] starting',
    );

    const [financeResult, remindersResult] = await Promise.allSettled([
      this.checkOverdueEntries.execute({ tenantId, createdBy: userId }),
      this.processDueReminders.execute(),
    ]);

    const elapsed = Date.now() - t0;
    const mem1 = process.memoryUsage();

    if (financeResult.status === 'rejected') {
      logger.error(
        { err: financeResult.reason, tenantId, elapsedMs: elapsed },
        '[routine-check] checkOverdueEntries failed',
      );
    }
    if (remindersResult.status === 'rejected') {
      logger.error(
        { err: remindersResult.reason, tenantId, elapsedMs: elapsed },
        '[routine-check] processDueReminders failed',
      );
    }

    logger.info(
      {
        tenantId,
        elapsedMs: elapsed,
        finance: financeResult.status === 'fulfilled' ? financeResult.value : 'error',
        reminders: remindersResult.status === 'fulfilled' ? remindersResult.value : 'error',
        heapBefore: Math.round(mem0.heapUsed / 1024 / 1024),
        heapAfter: Math.round(mem1.heapUsed / 1024 / 1024),
      },
      '[routine-check] completed',
    );

    return {
      finance:
        financeResult.status === 'fulfilled'
          ? {
              markedOverdue: financeResult.value.markedOverdue,
              dueSoonAlerts: financeResult.value.dueSoonAlerts,
            }
          : null,
      calendarReminders:
        remindersResult.status === 'fulfilled'
          ? {
              processed: remindersResult.value.processed,
              errors: remindersResult.value.errors,
            }
          : null,
    };
  }
}
