import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { ListDepartmentsUseCase } from '../list-departments';

export function makeListDepartmentsUseCase(): ListDepartmentsUseCase {
  const departmentsRepository = new PrismaDepartmentsRepository();
  const useCase = new ListDepartmentsUseCase(departmentsRepository);

  return useCase;
}
