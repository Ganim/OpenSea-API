import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { ApproveAbsenceUseCase } from '../approve-absence';

export function makeApproveAbsenceUseCase(): ApproveAbsenceUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const calendarSyncService = makeCalendarSyncService();
  const transactionManager = new PrismaTransactionManager();

  return new ApproveAbsenceUseCase(
    absencesRepository,
    vacationPeriodsRepository,
    employeesRepository,
    calendarSyncService,
    transactionManager,
  );
}
