import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { GetEmployeeByIdUseCase } from '../get-employee-by-id';

export function makeGetEmployeeByIdUseCase(): GetEmployeeByIdUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new GetEmployeeByIdUseCase(employeesRepository);

  return useCase;
}
