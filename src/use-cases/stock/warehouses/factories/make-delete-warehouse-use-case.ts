import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { DeleteWarehouseUseCase } from '../delete-warehouse';

export function makeDeleteWarehouseUseCase() {
  const warehousesRepository = new PrismaWarehousesRepository();
  return new DeleteWarehouseUseCase(warehousesRepository);
}
