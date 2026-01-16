import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { PreviewZoneStructureUseCase } from '../preview-zone-structure';

export function makePreviewZoneStructureUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const warehousesRepository = new PrismaWarehousesRepository();
  return new PreviewZoneStructureUseCase(zonesRepository, warehousesRepository);
}
