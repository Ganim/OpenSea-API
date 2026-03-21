import { PrismaTransactionManager } from '@/lib/transaction-manager';
import { PrismaInventorySessionItemsRepository } from '@/repositories/stock/prisma/prisma-inventory-session-items-repository';
import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { ResolveDivergenceUseCase } from '../resolve-divergence';

export function makeResolveDivergenceUseCase() {
  return new ResolveDivergenceUseCase(
    new PrismaInventorySessionsRepository(),
    new PrismaInventorySessionItemsRepository(),
    new PrismaItemsRepository(),
    new PrismaItemMovementsRepository(),
    new PrismaTransactionManager(),
  );
}
