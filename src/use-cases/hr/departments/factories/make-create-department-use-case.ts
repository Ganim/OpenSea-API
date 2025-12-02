import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { CreateDepartmentUseCase } from '../create-department';

export function makeCreateDepartmentUseCase(): CreateDepartmentUseCase {
  const departmentsRepository = new PrismaDepartmentsRepository();
  const useCase = new CreateDepartmentUseCase(departmentsRepository);

  return useCase;
}
