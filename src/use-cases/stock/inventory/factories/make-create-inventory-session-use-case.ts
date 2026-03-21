import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaInventorySessionItemsRepository } from '@/repositories/stock/prisma/prisma-inventory-session-items-repository';
import { PrismaInventorySessionsRepository } from '@/repositories/stock/prisma/prisma-inventory-sessions-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { CreateInventorySessionUseCase } from '../create-inventory-session';

export function makeCreateInventorySessionUseCase() {
  return new CreateInventorySessionUseCase(
    new PrismaInventorySessionsRepository(),
    new PrismaInventorySessionItemsRepository(),
    new PrismaItemsRepository(),
    new PrismaBinsRepository(),
    new PrismaZonesRepository(),
  );
}
