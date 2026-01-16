import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { GenerateLabelsByZoneUseCase } from '../generate-labels-by-zone';

export function makeGenerateLabelsByZoneUseCase(): GenerateLabelsByZoneUseCase {
  const binsRepository = new PrismaBinsRepository();
  const zonesRepository = new PrismaZonesRepository();
  const warehousesRepository = new PrismaWarehousesRepository();

  return new GenerateLabelsByZoneUseCase(
    binsRepository,
    zonesRepository,
    warehousesRepository,
  );
}
