import { PrismaAbsencesRepository } from '@/repositories/hr/prisma/prisma-absences-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaVacationPeriodsRepository } from '@/repositories/hr/prisma/prisma-vacation-periods-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { RequestVacationUseCase } from '../request-vacation';

export function makeRequestVacationUseCase(): RequestVacationUseCase {
  const absencesRepository = new PrismaAbsencesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const vacationPeriodsRepository = new PrismaVacationPeriodsRepository();
  const calendarSyncService = makeCalendarSyncService();

  return new RequestVacationUseCase(
    absencesRepository,
    employeesRepository,
    vacationPeriodsRepository,
    calendarSyncService,
  );
}
