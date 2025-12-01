import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaOvertimeRepository } from '@/repositories/hr/prisma/prisma-overtime-repository';
import { RequestOvertimeUseCase } from '../request-overtime';

export function makeRequestOvertimeUseCase(): RequestOvertimeUseCase {
  const overtimeRepository = new PrismaOvertimeRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new RequestOvertimeUseCase(
    overtimeRepository,
    employeesRepository,
  );

  return useCase;
}
