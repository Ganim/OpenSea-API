import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { CreateZoneUseCase } from '../create-zone';

export function makeCreateZoneUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const warehousesRepository = new PrismaWarehousesRepository();
  return new CreateZoneUseCase(zonesRepository, warehousesRepository);
}
