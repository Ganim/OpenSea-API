import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { UpdateEmployeeUseCase } from '../update-employee';

export function makeUpdateEmployeeUseCase(): UpdateEmployeeUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new UpdateEmployeeUseCase(employeesRepository);

  return useCase;
}
