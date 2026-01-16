import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { DeleteZoneUseCase } from '../delete-zone';

export function makeDeleteZoneUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  const binsRepository = new PrismaBinsRepository();
  return new DeleteZoneUseCase(zonesRepository, binsRepository);
}
