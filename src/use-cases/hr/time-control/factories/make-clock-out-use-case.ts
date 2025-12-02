import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { ClockOutUseCase } from '../clock-out';

export function makeClockOutUseCase(): ClockOutUseCase {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new ClockOutUseCase(
    timeEntriesRepository,
    employeesRepository,
  );

  return useCase;
}
