import { PrismaEmployeeWarningsRepository } from '@/repositories/hr/prisma/prisma-employee-warnings-repository';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { CreateWarningUseCase } from '../create-warning';

export function makeCreateWarningUseCase(): CreateWarningUseCase {
  const warningsRepository = new PrismaEmployeeWarningsRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new CreateWarningUseCase(warningsRepository, employeesRepository);
}
