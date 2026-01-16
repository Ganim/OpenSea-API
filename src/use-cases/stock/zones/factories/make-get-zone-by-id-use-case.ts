import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { GetZoneByIdUseCase } from '../get-zone-by-id';

export function makeGetZoneByIdUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const warehousesRepository = new PrismaWarehousesRepository();
  return new GetZoneByIdUseCase(zonesRepository, warehousesRepository);
}
