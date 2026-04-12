import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { GetPosSessionSummaryUseCase } from '../get-pos-session-summary';

export function makeGetPosSessionSummaryUseCase() {
  return new GetPosSessionSummaryUseCase(
    new PrismaPosSessionsRepository(),
    new PrismaPosCashMovementsRepository(),
  );
}
