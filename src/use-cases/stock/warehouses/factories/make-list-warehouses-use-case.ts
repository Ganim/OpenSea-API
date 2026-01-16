import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { ListWarehousesUseCase } from '../list-warehouses';

export function makeListWarehousesUseCase() {
  const warehousesRepository = new PrismaWarehousesRepository();
  return new ListWarehousesUseCase(warehousesRepository);
}
