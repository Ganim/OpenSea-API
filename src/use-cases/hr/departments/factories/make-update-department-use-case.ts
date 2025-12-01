import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { UpdateDepartmentUseCase } from '../update-department';

export function makeUpdateDepartmentUseCase(): UpdateDepartmentUseCase {
  const departmentsRepository = new PrismaDepartmentsRepository();
  const useCase = new UpdateDepartmentUseCase(departmentsRepository);

  return useCase;
}
