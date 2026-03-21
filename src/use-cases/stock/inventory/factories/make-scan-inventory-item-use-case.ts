import { PrismaInventorySessionItemsRepository } from '@/repositories/stock/prisma/prisma-inventory-session-items-repository';
import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { ScanInventoryItemUseCase } from '../scan-inventory-item';

export function makeScanInventoryItemUseCase() {
  return new ScanInventoryItemUseCase(
    new PrismaInventorySessionsRepository(),
    new PrismaInventorySessionItemsRepository(),
    new PrismaItemsRepository(),
  );
}
