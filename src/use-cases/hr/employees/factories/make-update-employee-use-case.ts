import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { UpdateEmployeeUseCase } from '../update-employee';

export function makeUpdateEmployeeUseCase(): UpdateEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const calendarSyncService = makeCalendarSyncService();

  return new UpdateEmployeeUseCase(employeesRepository, calendarSyncService);
}
