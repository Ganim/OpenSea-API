import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { UpdateZoneUseCase } from '../update-zone';

export function makeUpdateZoneUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  return new UpdateZoneUseCase(zonesRepository);
}
