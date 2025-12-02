import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { ListEmployeesUseCase } from '../list-employees';

export function makeListEmployeesUseCase(): ListEmployeesUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const useCase = new ListEmployeesUseCase(employeesRepository);

  return useCase;
}
