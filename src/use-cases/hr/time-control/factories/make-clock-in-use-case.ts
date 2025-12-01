import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTimeEntriesRepository } from '@/repositories/hr/prisma/prisma-time-entries-repository';
import { ClockInUseCase } from '../clock-in';

export function makeClockInUseCase(): ClockInUseCase {
  const timeEntriesRepository = new PrismaTimeEntriesRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new ClockInUseCase(timeEntriesRepository, employeesRepository);

  return useCase;
}
