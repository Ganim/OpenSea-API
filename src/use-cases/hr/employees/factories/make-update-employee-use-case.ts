import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaSalaryHistoryRepository } from '@/repositories/hr/prisma/prisma-salary-history-repository';
import { makeCalendarSyncService } from '@/services/calendar/make-calendar-sync-service';
import { UpdateEmployeeUseCase } from '../update-employee';

export function makeUpdateEmployeeUseCase(): UpdateEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const calendarSyncService = makeCalendarSyncService();
  const salaryHistoryRepository = new PrismaSalaryHistoryRepository();

  return new UpdateEmployeeUseCase(
    employeesRepository,
    calendarSyncService,
    salaryHistoryRepository,
  );
}
