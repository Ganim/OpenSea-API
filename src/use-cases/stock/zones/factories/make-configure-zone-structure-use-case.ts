import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { ConfigureZoneStructureUseCase } from '../configure-zone-structure';

export function makeConfigureZoneStructureUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const binsRepository = new PrismaBinsRepository();
  const warehousesRepository = new PrismaWarehousesRepository();
  return new ConfigureZoneStructureUseCase(
    zonesRepository,
    binsRepository,
    warehousesRepository,
  );
}
