import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { UpdateWarehouseUseCase } from '../update-warehouse';

export function makeUpdateWarehouseUseCase() {
  const warehousesRepository = new PrismaWarehousesRepository();
  return new UpdateWarehouseUseCase(warehousesRepository);
}
