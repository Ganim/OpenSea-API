import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { PrismaPosTerminalOperatorsRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-operators-repository';

import { ClosePosSessionUseCase } from '../close-pos-session';
import { ClosePosSessionFromDeviceUseCase } from '../close-pos-session-from-device';

export function makeClosePosSessionFromDeviceUseCase() {
  const innerClose = new ClosePosSessionUseCase(
    new PrismaPosSessionsRepository(),
    new PrismaPosCashMovementsRepository(),
  );
  return new ClosePosSessionFromDeviceUseCase(
    new PrismaPosTerminalOperatorsRepository(),
    new PrismaEmployeesRepository(),
    innerClose,
  );
}
