import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { GenerateLabelsUseCase } from '../generate-labels';

export function makeGenerateLabelsUseCase(): GenerateLabelsUseCase {
  const binsRepository = new PrismaBinsRepository();
  const zonesRepository = new PrismaZonesRepository();
  const warehousesRepository = new PrismaWarehousesRepository();

  return new GenerateLabelsUseCase(
    binsRepository,
    zonesRepository,
    warehousesRepository,
  );
}
