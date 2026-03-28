import { PrismaEmployeeWarningsRepository } from '@/repositories/hr/prisma/prisma-employee-warnings-repository';
import { UpdateWarningUseCase } from '../update-warning';

export function makeUpdateWarningUseCase(): UpdateWarningUseCase {
  const warningsRepository = new PrismaEmployeeWarningsRepository();

  return new UpdateWarningUseCase(warningsRepository);
}
