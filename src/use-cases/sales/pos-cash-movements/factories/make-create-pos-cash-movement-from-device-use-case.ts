import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { PrismaPosTerminalOperatorsRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-operators-repository';

import { CreatePosCashMovementUseCase } from '../create-pos-cash-movement';
import { CreatePosCashMovementFromDeviceUseCase } from '../create-pos-cash-movement-from-device';

export function makeCreatePosCashMovementFromDeviceUseCase() {
  const innerUseCase = new CreatePosCashMovementUseCase(
    new PrismaPosCashMovementsRepository(),
    new PrismaPosSessionsRepository(),
  );
  return new CreatePosCashMovementFromDeviceUseCase(
    new PrismaPosTerminalOperatorsRepository(),
    new PrismaEmployeesRepository(),
    innerUseCase,
  );
}
