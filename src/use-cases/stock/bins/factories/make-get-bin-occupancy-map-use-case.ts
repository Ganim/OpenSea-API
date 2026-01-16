import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { GetBinOccupancyMapUseCase } from '../get-bin-occupancy-map';

export function makeGetBinOccupancyMapUseCase() {
  const binsRepository = new PrismaBinsRepository();
  const zonesRepository = new PrismaZonesRepository();
  return new GetBinOccupancyMapUseCase(binsRepository, zonesRepository);
}
