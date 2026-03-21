import { PrismaInventorySessionItemsRepository } from '@/repositories/stock/prisma/prisma-inventory-session-items-repository';
import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { GetInventorySessionUseCase } from '../get-inventory-session';

export function makeGetInventorySessionUseCase() {
  return new GetInventorySessionUseCase(
    new PrismaInventorySessionsRepository(),
    new PrismaInventorySessionItemsRepository(),
  );
}
