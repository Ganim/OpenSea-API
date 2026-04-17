import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaEmployeeWarningsRepository } from '@/repositories/hr/prisma/prisma-employee-warnings-repository';
import { AcknowledgeWarningUseCase } from '../acknowledge-warning';

export function makeAcknowledgeWarningUseCase(): AcknowledgeWarningUseCase {
  const warningsRepository = new PrismaEmployeeWarningsRepository();
  const employeesRepository = new PrismaEmployeesRepository();

  return new AcknowledgeWarningUseCase(warningsRepository, employeesRepository);
}
