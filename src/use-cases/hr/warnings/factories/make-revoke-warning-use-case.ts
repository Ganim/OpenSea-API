import { PrismaEmployeeWarningsRepository } from '@/repositories/hr/prisma/prisma-employee-warnings-repository';
import { RevokeWarningUseCase } from '../revoke-warning';

export function makeRevokeWarningUseCase(): RevokeWarningUseCase {
  const warningsRepository = new PrismaEmployeeWarningsRepository();

  return new RevokeWarningUseCase(warningsRepository);
}
