import { PrismaInventorySessionItemsRepository } from '@/repositories/stock/prisma/prisma-inventory-session-items-repository';
import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { CompleteInventorySessionUseCase } from '../complete-inventory-session';

export function makeCompleteInventorySessionUseCase() {
  return new CompleteInventorySessionUseCase(
    new PrismaInventorySessionsRepository(),
    new PrismaInventorySessionItemsRepository(),
  );
}
