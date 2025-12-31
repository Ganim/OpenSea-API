import { PrismaCompaniesRepository } from '@/repositories/hr/prisma/prisma-companies-repository';
import { PrismaDepartmentsRepository } from '@/repositories/hr/prisma/prisma-departments-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPositionsRepository } from '@/repositories/hr/prisma/prisma-positions-repository';
import { GetPositionByIdUseCase } from '../get-position-by-id';

export function makeGetPositionByIdUseCase(): GetPositionByIdUseCase {
  const positionsRepository = new PrismaPositionsRepository();
  const departmentsRepository = new PrismaDepartmentsRepository();
  const companiesRepository = new PrismaCompaniesRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  const useCase = new GetPositionByIdUseCase(
    positionsRepository,
    departmentsRepository,
    companiesRepository,
    employeesRepository,
  );

  return useCase;
}
