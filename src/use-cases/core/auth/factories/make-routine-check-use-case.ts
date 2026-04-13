import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeCheckOverdueEntriesUseCase } from '@/use-cases/finance/entries/factories/make-check-overdue-entries-use-case';
import { makeProcessDueRemindersUseCase } from '@/use-cases/calendar/events/factories/make-process-due-reminders-use-case';
import { RoutineCheckUseCase } from '../routine-check';

export function makeRoutineCheckUseCase() {
  return new RoutineCheckUseCase(
    makeCheckOverdueEntriesUseCase(),
    makeProcessDueRemindersUseCase(),
    getPermissionService(),
  );
}
