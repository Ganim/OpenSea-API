import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { GetProductionOrderByIdUseCase } from '../get-production-order-by-id';

export function makeGetProductionOrderByIdUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  const getProductionOrderByIdUseCase = new GetProductionOrderByIdUseCase(
    productionOrdersRepository,
  );
  return getProductionOrderByIdUseCase;
}
