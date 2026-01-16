import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { GetBinDetailUseCase } from '../get-bin-detail';

export function makeGetBinDetailUseCase() {
  const binsRepository = new PrismaBinsRepository();
  const itemsRepository = new PrismaItemsRepository();
  const zonesRepository = new PrismaZonesRepository();
  const warehousesRepository = new PrismaWarehousesRepository();
  return new GetBinDetailUseCase(
    binsRepository,
    itemsRepository,
    zonesRepository,
    warehousesRepository,
  );
}
