import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaItemMovementsRepository } from '@/repositories/stock/prisma/prisma-item-movements-repository';
import { ConfigureZoneStructureUseCase } from '../configure-zone-structure';

export function makeConfigureZoneStructureUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const binsRepository = new PrismaBinsRepository();
  const warehousesRepository = new PrismaWarehousesRepository();
  const itemsRepository = new PrismaItemsRepository();
  const itemMovementsRepository = new PrismaItemMovementsRepository();
  return new ConfigureZoneStructureUseCase(
    zonesRepository,
    binsRepository,
    warehousesRepository,
    itemsRepository,
    itemMovementsRepository,
  );
}
