import type { CheckOverdueEntriesUseCase } from '@/use-cases/finance/entries/check-overdue-entries';
import type { ProcessDueRemindersUseCase } from '@/use-cases/calendar/events/process-due-reminders';

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

    const [financeResult, remindersResult] = await Promise.allSettled([
      this.checkOverdueEntries.execute({ tenantId, createdBy: userId }),
      this.processDueReminders.execute(),
    ]);

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
