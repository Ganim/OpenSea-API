import { PrismaEmployeeWarningsRepository } from '@/repositories/hr/prisma/prisma-employee-warnings-repository';
import { AcknowledgeWarningUseCase } from '../acknowledge-warning';

export function makeAcknowledgeWarningUseCase(): AcknowledgeWarningUseCase {
  const warningsRepository = new PrismaEmployeeWarningsRepository();

  return new AcknowledgeWarningUseCase(warningsRepository);
}
