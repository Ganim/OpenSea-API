import { PrismaPosCashMovementsRepository } from '@/repositories/sales/prisma/prisma-pos-cash-movements-repository';
import { PrismaPosSessionsRepository } from '@/repositories/sales/prisma/prisma-pos-sessions-repository';
import { CreatePosCashMovementUseCase } from '../create-pos-cash-movement';

export function makeCreatePosCashMovementUseCase() {
  return new CreatePosCashMovementUseCase(
    new PrismaPosCashMovementsRepository(),
    new PrismaPosSessionsRepository(),
  );
}
