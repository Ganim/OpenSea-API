import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaGeneratedEmploymentContractsRepository } from '@/repositories/hr/prisma/prisma-generated-employment-contracts-repository';
import { ListEmployeeContractsUseCase } from '../list-employee-contracts';

export function makeListEmployeeContractsUseCase(): ListEmployeeContractsUseCase {
  const employeesRepository = new PrismaEmployeesRepository();
  const generatedContractsRepository =
    new PrismaGeneratedEmploymentContractsRepository();
  return new ListEmployeeContractsUseCase(
    employeesRepository,
    generatedContractsRepository,
  );
}
