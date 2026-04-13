import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { ChangeProductionOrderStatusUseCase } from '../change-production-order-status';

export function makeChangeProductionOrderStatusUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  const changeProductionOrderStatusUseCase =
    new ChangeProductionOrderStatusUseCase(productionOrdersRepository);
  return changeProductionOrderStatusUseCase;
}
