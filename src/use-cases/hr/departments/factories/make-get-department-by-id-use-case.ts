import { PrismaCompaniesRepository } from '@/repositories/hr/prisma/prisma-companies-repository';
import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { PrismaPositionsRepository } from '@/repositories/hr/prisma/prisma-positions-repository';
import { GetDepartmentByIdUseCase } from '../get-department-by-id';

export function makeGetDepartmentByIdUseCase(): GetDepartmentByIdUseCase {
  const departmentsRepository = new PrismaDepartmentsRepository();
  const companiesRepository = new PrismaCompaniesRepository();
  const positionsRepository = new PrismaPositionsRepository();

  const useCase = new GetDepartmentByIdUseCase(
    departmentsRepository,
    companiesRepository,
    positionsRepository,
  );

  return useCase;
}
