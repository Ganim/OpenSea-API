import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { OpenPosSessionUseCase } from '../open-pos-session';

export function makeOpenPosSessionUseCase() {
  return new OpenPosSessionUseCase(
    new PrismaPosSessionsRepository(),
    new PrismaPosTerminalsRepository(),
    new PrismaPosCashMovementsRepository(),
  );
}
