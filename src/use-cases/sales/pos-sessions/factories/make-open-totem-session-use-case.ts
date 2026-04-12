import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { OpenTotemSessionUseCase } from '../open-totem-session';

export function makeOpenTotemSessionUseCase() {
  return new OpenTotemSessionUseCase(
    new PrismaPosSessionsRepository(),
    new PrismaPosTerminalsRepository(),
    new PrismaPosCashMovementsRepository(),
  );
}
