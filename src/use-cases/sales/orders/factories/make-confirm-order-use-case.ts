import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { ConfirmOrderUseCase } from '../confirm-order';

export function makeConfirmOrderUseCase() {
  return new ConfirmOrderUseCase(
    new PrismaOrdersRepository(),
    new PrismaPipelineStagesRepository(),
  );
}
