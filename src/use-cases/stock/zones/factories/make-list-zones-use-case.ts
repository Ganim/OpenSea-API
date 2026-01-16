import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { ListZonesUseCase } from '../list-zones';

export function makeListZonesUseCase() {
  const zonesRepository = new PrismaZonesRepository();
  return new ListZonesUseCase(zonesRepository);
}
