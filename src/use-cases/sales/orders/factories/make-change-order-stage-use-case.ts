import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPipelineStagesRepository } from '@/repositories/sales/prisma/prisma-pipeline-stages-repository';
import { ChangeOrderStageUseCase } from '../change-order-stage';

export function makeChangeOrderStageUseCase() {
  return new ChangeOrderStageUseCase(
    new PrismaOrdersRepository(),
    new PrismaPipelineStagesRepository(),
  );
}
