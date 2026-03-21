import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { ListInventorySessionsUseCase } from '../list-inventory-sessions';

export function makeListInventorySessionsUseCase() {
  return new ListInventorySessionsUseCase(
    new PrismaInventorySessionsRepository(),
  );
}
