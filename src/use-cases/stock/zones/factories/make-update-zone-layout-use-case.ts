import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { UpdateZoneLayoutUseCase } from '../update-zone-layout';

export function makeUpdateZoneLayoutUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  return new UpdateZoneLayoutUseCase(zonesRepository);
}
