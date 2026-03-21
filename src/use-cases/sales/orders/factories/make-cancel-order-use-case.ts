import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { CancelOrderUseCase } from '../cancel-order';

export function makeCancelOrderUseCase() {
  return new CancelOrderUseCase(
    new PrismaOrdersRepository(),
    new PrismaPipelineStagesRepository(),
  );
}
