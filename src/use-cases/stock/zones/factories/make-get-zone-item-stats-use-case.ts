import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { GetZoneItemStatsUseCase } from '../get-zone-item-stats';

export function makeGetZoneItemStatsUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const binsRepository = new PrismaBinsRepository();
  return new GetZoneItemStatsUseCase(zonesRepository, binsRepository);
}
