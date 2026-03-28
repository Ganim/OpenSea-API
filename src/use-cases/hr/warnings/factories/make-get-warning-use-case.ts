import { PrismaEmployeeWarningsRepository } from '@/repositories/hr/prisma/prisma-employee-warnings-repository';
import { GetWarningUseCase } from '../get-warning';

export function makeGetWarningUseCase(): GetWarningUseCase {
  const warningsRepository = new PrismaEmployeeWarningsRepository();

  return new GetWarningUseCase(warningsRepository);
}
