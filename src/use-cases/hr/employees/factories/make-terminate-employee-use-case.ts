import { PrismaCipaMembersRepository } from '@/repositories/hr/prisma/prisma-cipa-members-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { TerminateEmployeeUseCase } from '../terminate-employee';

export function makeTerminateEmployeeUseCase(): TerminateEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const cipaMembersRepository = new PrismaCipaMembersRepository();
  const useCase = new TerminateEmployeeUseCase(
    employeesRepository,
    cipaMembersRepository,
  );

  return useCase;
}
