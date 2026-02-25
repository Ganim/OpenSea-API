import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { CancelAbsenceUseCase } from '../cancel-absence';

export function makeCancelAbsenceUseCase(): CancelAbsenceUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const calendarSyncService = makeCalendarSyncService();

  return new CancelAbsenceUseCase(
    absencesRepository,
    vacationPeriodsRepository,
    calendarSyncService,
  );
}
