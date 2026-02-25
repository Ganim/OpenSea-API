import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { ApproveAbsenceUseCase } from '../approve-absence';

export function makeApproveAbsenceUseCase(): ApproveAbsenceUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const calendarSyncService = makeCalendarSyncService();

  return new ApproveAbsenceUseCase(
    absencesRepository,
    vacationPeriodsRepository,
    calendarSyncService,
  );
}
