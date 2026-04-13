import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { CountProductionOrdersByStatusUseCase } from '../count-production-orders-by-status';

export function makeCountProductionOrdersByStatusUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  const countProductionOrdersByStatusUseCase =
    new CountProductionOrdersByStatusUseCase(productionOrdersRepository);
  return countProductionOrdersByStatusUseCase;
}
