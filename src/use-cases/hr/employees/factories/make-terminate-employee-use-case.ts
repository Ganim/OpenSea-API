import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { TerminateEmployeeUseCase } from '../terminate-employee';

export function makeTerminateEmployeeUseCase(): TerminateEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new TerminateEmployeeUseCase(employeesRepository);

  return useCase;
}
