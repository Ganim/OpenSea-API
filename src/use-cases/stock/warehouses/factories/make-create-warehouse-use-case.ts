import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { CreateWarehouseUseCase } from '../create-warehouse';

export function makeCreateWarehouseUseCase() {
  const warehousesRepository = new PrismaWarehousesRepository();
  return new CreateWarehouseUseCase(warehousesRepository);
}
