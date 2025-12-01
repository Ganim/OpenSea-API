import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { DeleteDepartmentUseCase } from '../delete-department';

export function makeDeleteDepartmentUseCase(): DeleteDepartmentUseCase {
  const departmentsRepository = new PrismaDepartmentsRepository();
  const useCase = new DeleteDepartmentUseCase(departmentsRepository);

  return useCase;
}
