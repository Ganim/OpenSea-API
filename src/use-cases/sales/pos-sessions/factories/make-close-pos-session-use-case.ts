import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { PrismaPosTransactionsRepository } from '@/repositories/sales/prisma/prisma-pos-transactions-repository';
import { ClosePosSessionUseCase } from '../close-pos-session';

export function makeClosePosSessionUseCase() {
  return new ClosePosSessionUseCase(
    new PrismaPosSessionsRepository(),
    new PrismaPosCashMovementsRepository(),
    new PrismaPosTransactionsRepository(),
  );
}
