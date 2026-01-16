import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { GetWarehouseByIdUseCase } from '../get-warehouse-by-id';

export function makeGetWarehouseByIdUseCase() {
  const warehousesRepository = new PrismaWarehousesRepository();
  return new GetWarehouseByIdUseCase(warehousesRepository);
}
