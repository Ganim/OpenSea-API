import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { CreateEmployeeUseCase } from '../create-employee';

export function makeCreateEmployeeUseCase(): CreateEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const calendarSyncService = makeCalendarSyncService();

  return new CreateEmployeeUseCase(employeesRepository, calendarSyncService);
}
