import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { GetLabelPreviewUseCase } from '../get-label-preview';

export function makeGetLabelPreviewUseCase(): GetLabelPreviewUseCase {
  const binsRepository = new PrismaBinsRepository();
  const zonesRepository = new PrismaZonesRepository();
  const warehousesRepository = new PrismaWarehousesRepository();

  return new GetLabelPreviewUseCase(
    binsRepository,
    zonesRepository,
    warehousesRepository,
  );
}
