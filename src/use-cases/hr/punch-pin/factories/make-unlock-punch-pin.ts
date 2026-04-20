import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

import { UnlockPunchPinUseCase } from '../unlock-punch-pin';

export function makeUnlockPunchPinUseCase(): UnlockPunchPinUseCase {
  return new UnlockPunchPinUseCase(new PrismaEmployeesRepository());
}
