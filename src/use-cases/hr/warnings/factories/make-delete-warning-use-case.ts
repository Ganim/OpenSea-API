import { PrismaEmployeeWarningsRepository } from '@/repositories/hr/prisma/prisma-employee-warnings-repository';
import { DeleteWarningUseCase } from '../delete-warning';

export function makeDeleteWarningUseCase(): DeleteWarningUseCase {
  const warningsRepository = new PrismaEmployeeWarningsRepository();

  return new DeleteWarningUseCase(warningsRepository);
}
