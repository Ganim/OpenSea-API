import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

import { VerifyPunchPinUseCase } from '../verify-punch-pin';

export function makeVerifyPunchPinUseCase(): VerifyPunchPinUseCase {
  return new VerifyPunchPinUseCase(new PrismaEmployeesRepository());
}
