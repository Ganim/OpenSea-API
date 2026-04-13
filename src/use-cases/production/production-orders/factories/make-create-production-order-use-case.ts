import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { CreateProductionOrderUseCase } from '../create-production-order';

export function makeCreateProductionOrderUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  const createProductionOrderUseCase = new CreateProductionOrderUseCase(
    productionOrdersRepository,
  );
  return createProductionOrderUseCase;
}
