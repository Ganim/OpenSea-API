import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateEmployeeUseCase } from '../create-employee';

export function makeCreateEmployeeUseCase(): CreateEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new CreateEmployeeUseCase(employeesRepository);

  return useCase;
}
