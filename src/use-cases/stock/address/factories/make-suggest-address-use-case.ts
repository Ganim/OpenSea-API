import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { SuggestAddressUseCase } from '../suggest-address';

export function makeSuggestAddressUseCase(): SuggestAddressUseCase {
  const binsRepository = new PrismaBinsRepository();
  const zonesRepository = new PrismaZonesRepository();
  const warehousesRepository = new PrismaWarehousesRepository();

  return new SuggestAddressUseCase(
    binsRepository,
    zonesRepository,
    warehousesRepository,
  );
}
