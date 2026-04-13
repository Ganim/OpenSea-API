import { PrismaProductionOrdersRepository } from '@/repositories/production/prisma/prisma-production-orders-repository';
import { CancelProductionOrderUseCase } from '../cancel-production-order';

export function makeCancelProductionOrderUseCase() {
  const productionOrdersRepository = new PrismaProductionOrdersRepository();
  const cancelProductionOrderUseCase = new CancelProductionOrderUseCase(
    productionOrdersRepository,
  );
  return cancelProductionOrderUseCase;
}
