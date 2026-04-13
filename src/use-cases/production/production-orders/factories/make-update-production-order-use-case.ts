import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { UpdateProductionOrderUseCase } from '../update-production-order';

export function makeUpdateProductionOrderUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  const updateProductionOrderUseCase = new UpdateProductionOrderUseCase(
    productionOrdersRepository,
  );
  return updateProductionOrderUseCase;
}
