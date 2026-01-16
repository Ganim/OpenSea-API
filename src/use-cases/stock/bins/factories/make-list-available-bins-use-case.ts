import { PrismaBinsRepository } from '@/repositories/stock/prisma/prisma-bins-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { ListAvailableBinsUseCase } from '../list-available-bins';

export function makeListAvailableBinsUseCase() {
  const binsRepository = new PrismaBinsRepository();
  const zonesRepository = new PrismaZonesRepository();
  return new ListAvailableBinsUseCase(binsRepository, zonesRepository);
}
