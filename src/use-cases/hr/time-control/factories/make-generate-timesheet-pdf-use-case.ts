import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { GenerateTimesheetPDFUseCase } from '../generate-timesheet-pdf';

export function makeGenerateTimesheetPDFUseCase() {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new GenerateTimesheetPDFUseCase(
    timeEntriesRepository,
    employeesRepository,
  );
}
