import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { ListProductionOrdersUseCase } from '../list-production-orders';

export function makeListProductionOrdersUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  const listProductionOrdersUseCase = new ListProductionOrdersUseCase(
    productionOrdersRepository,
  );
  return listProductionOrdersUseCase;
}
