import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';

import { SetPunchPinUseCase } from '../set-punch-pin';

export function makeSetPunchPinUseCase(): SetPunchPinUseCase {
  return new SetPunchPinUseCase(new PrismaEmployeesRepository());
}
