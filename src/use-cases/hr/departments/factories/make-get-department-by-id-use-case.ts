import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { GetDepartmentByIdUseCase } from '../get-department-by-id';

export function makeGetDepartmentByIdUseCase(): GetDepartmentByIdUseCase {
  const departmentsRepository = new PrismaDepartmentsRepository();
  const useCase = new GetDepartmentByIdUseCase(departmentsRepository);

  return useCase;
}
