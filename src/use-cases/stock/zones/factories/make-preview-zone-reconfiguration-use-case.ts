import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { PreviewZoneReconfigurationUseCase } from '../preview-zone-reconfiguration';

export function makePreviewZoneReconfigurationUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const binsRepository = new PrismaBinsRepository();
  const warehousesRepository = new PrismaWarehousesRepository();
  return new PreviewZoneReconfigurationUseCase(
    zonesRepository,
    binsRepository,
    warehousesRepository,
  );
}
