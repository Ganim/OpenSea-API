import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { CalculateWorkedHoursUseCase } from '../calculate-worked-hours';

export function makeCalculateWorkedHoursUseCase(): CalculateWorkedHoursUseCase {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new CalculateWorkedHoursUseCase(
    timeEntriesRepository,
    employeesRepository,
  );

  return useCase;
}
