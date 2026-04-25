import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { PrismaPosTerminalOperatorsRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-operators-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';

import { OpenPosSessionUseCase } from '../open-pos-session';
import { OpenPosSessionFromDeviceUseCase } from '../open-pos-session-from-device';

export function makeOpenPosSessionFromDeviceUseCase() {
  const innerOpenSession = new OpenPosSessionUseCase(
    new PrismaPosSessionsRepository(),
    new PrismaPosTerminalsRepository(),
    new PrismaPosCashMovementsRepository(),
  );
  return new OpenPosSessionFromDeviceUseCase(
    new PrismaPosTerminalOperatorsRepository(),
    new PrismaEmployeesRepository(),
    innerOpenSession,
  );
}
