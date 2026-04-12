import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { ClosePosSessionUseCase } from '../close-pos-session';

export function makeClosePosSessionUseCase() {
  return new ClosePosSessionUseCase(
    new PrismaPosSessionsRepository(),
    new PrismaPosCashMovementsRepository(),
  );
}
