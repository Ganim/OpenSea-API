import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { ResetZoneLayoutUseCase } from '../reset-zone-layout';

export function makeResetZoneLayoutUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  return new ResetZoneLayoutUseCase(zonesRepository);
}
