import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { LinkUserToEmployeeUseCase } from '../link-user-to-employee';

export function makeLinkUserToEmployeeUseCase(): LinkUserToEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new LinkUserToEmployeeUseCase(employeesRepository);

  return useCase;
}
